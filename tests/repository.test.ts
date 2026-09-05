import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Repository } from '../src/data/repository.ts';
import type { Bind, Database } from '../src/data/repository.ts';
import { ScanGate } from '../src/scanner/scanGate.ts';
function open(path = ':memory:') {
  const native = new DatabaseSync(path);
  const db: Database = {
    execSync: sql => native.exec(sql),
    runSync: (sql, ...p: Bind[]) => { const r = native.prepare(sql).run(...p); return {changes: Number(r.changes),lastInsertRowId: Number(r.lastInsertRowid)}; },
    getFirstSync: <T>(sql: string, ...p: Bind[]) => (native.prepare(sql).get(...p) as T | undefined) ?? null,
    getAllSync: <T>(sql: string, ...p: Bind[]) => native.prepare(sql).all(...p) as T[],
  };
  const repo = new Repository(db); repo.initialize();
  return { repo, native, db };
}
test('acceptance: 4/5, duplicate, unknown, missing photo, close/reopen, 5/5, finish', () => {
  const dir = mkdtempSync(join(process.cwd(), 'work/db-'));
  try {
    let {repo, native} = open(join(dir, 'kitback.db'));
    const kit = repo.addKit('Wedding Shoot');
    for (let i=1;i<=5;i++) repo.saveEquipment({kitId:kit,name:'Gear '+i,barcode:'KB-'+i,photo:'photo-'+i+'.jpg'});
    const session = repo.startSession(kit);
    for (let i=1;i<=4;i++) assert.equal(repo.scan(session,'KB-'+i).kind,'checked');
    assert.equal(repo.scan(session,'KB-4').kind,'duplicate');
    assert.equal(repo.scan(session,'unknown').kind,'unknown');
    assert.equal(repo.scan(session,'').kind,'invalid');
    assert.equal(repo.session(session).checked,4);
    const missing = repo.snapshot(session).filter(e=>!e.checkedAt);
    assert.equal(missing.length,1); assert.equal(missing[0].name,'Gear 5'); assert.equal(missing[0].photo,'photo-5.jpg');
    assert.throws(()=>repo.finishSession(session), /Check all/);
    native.close();
    ({repo,native}=open(join(dir,'kitback.db')));
    assert.equal(repo.session(session).checked,4); assert.equal(repo.session(session).status,'active');
    assert.equal(repo.scan(session,'KB-5').kind,'checked'); repo.finishSession(session); native.close();
    ({repo,native}=open(join(dir,'kitback.db')));
    assert.equal(repo.session(session).status,'completed'); assert.equal(repo.session(session).checked,5);
    assert.equal(repo.equipment(kit).length,5); assert.equal(repo.scan(session,'KB-1').kind,'closed');
    native.close();
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
test('snapshot survives item edit, deletion and additions; photo and old code retained', () => {
  const {repo,native}=open(); const kit=repo.addKit('Kit');
  const item=repo.saveEquipment({kitId:kit,name:'Original',barcode:'OLD',photo:'original.jpg'});
  const session=repo.startSession(kit);
  repo.saveEquipment({id:item,kitId:kit,name:'Edited',barcode:'NEW',photo:'new.jpg'});
  repo.deleteEquipment(item);
  repo.saveEquipment({kitId:kit,name:'Added later',barcode:'LATER',photo:null});
  assert.equal(repo.snapshot(session)[0].name,'Original');
  assert.equal(repo.snapshot(session)[0].photo,'original.jpg');
  assert.equal(repo.scan(session,'LATER').kind,'foreign');
  assert.equal(repo.scan(session,'OLD').kind,'checked');
  assert.equal(repo.session(session).total,1);
  assert.throws(()=>repo.saveEquipment({kitId:kit,name:'Reused',barcode:'NEW',photo:null}),/deleted physical/);
  native.close();
});
test('one active session, unique physical identifiers, empty kits and names', () => {
  const {repo,native}=open(); const a=repo.addKit('A'); const b=repo.addKit('B');
  assert.throws(()=>repo.startSession(a),/Add equipment/); assert.throws(()=>repo.addKit(' '));
  repo.saveEquipment({kitId:a,name:'Battery #1',barcode:'001',photo:null});
  assert.throws(()=>repo.saveEquipment({kitId:b,name:'Battery #2',barcode:'001',photo:null}),/already assigned/);
  const session=repo.startSession(a); assert.equal(repo.startSession(a),session);
  for(let i=0;i<100;i++) repo.scan(session,'001');
  assert.equal(repo.session(session).checked,1);
  repo.uncheck(session,repo.snapshot(session)[0].id); assert.equal(repo.session(session).checked,0);
  repo.scan(session,'001'); repo.finishSession(session);
  assert.throws(()=>repo.uncheck(session,repo.snapshot(session)[0].id),/Completed/);
  assert.notEqual(repo.startSession(a),session); native.close();
});
test('migration is repeatable and rejects a newer database without reset', () => {
  const {repo,native,db}=open(); repo.addKit('Preserve'); repo.initialize(); assert.equal(repo.kits().length,1);
  db.execSync('PRAGMA user_version=99'); assert.throws(()=>repo.initialize(),/newer/);
  assert.equal(repo.kits()[0].name,'Preserve'); native.close();
});
test('camera gate suppresses same code but permits different rapid codes and later duplicate feedback', () => {
  const gate=new ScanGate();
  assert.equal(gate.accept('A',0),true); assert.equal(gate.accept('A',50),false);
  assert.equal(gate.accept('B',60),true); assert.equal(gate.accept('A',1700),true);
});
