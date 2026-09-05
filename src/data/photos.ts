import { Directory, File, Paths } from 'expo-file-system';
const folder = () => new Directory(Paths.document,'equipment-photos');
export function photoUri(name:string):string {return new File(folder(),name).uri;}
export function persistPhoto(uri:string):string {
  const directory=folder(); directory.create({idempotent:true,intermediates:true});
  const name=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'.jpg';
  new File(uri).copy(new File(directory,name));
  return name;
}
// Remove only a newly imported, unsaved image; historical photos remain immutable.
export function discardDraftPhoto(name:string):void {
  const file=new File(folder(),name); if(file.exists) file.delete();
}
