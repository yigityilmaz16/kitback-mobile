import { ScrollView,Text,View } from 'react-native';
import { useState } from 'react';
import { useRepository } from '../data/context';
import { Button,Failure,GearPhoto,Loading,message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function KitScreen({navigation,route}:ScreenProps<'Kit'>) {
  const {kitId}=route.params; const repo=useRepository(); const [error,setError]=useState<string|null>(null);
  const query=useLiveQuery(()=>({kit:repo.kits().find(k=>k.id===kitId),items:repo.equipment(kitId),sessions:repo.sessions(kitId)}));
  function start(){try{const id=repo.startSession(kitId);navigation.navigate('Session',{sessionId:id});}catch(e){setError(message(e));}}
  const active=query.data?.sessions.find(x=>x.status==='active');
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Failure message={query.error} retry={query.reload}/>{!query.data&&!query.error&&<Loading/>}
    <Text style={s.title}>{query.data?.kit?.name??'Your kit'}</Text>
    <Text style={s.muted}>Each item is a physical piece of gear. Two identical batteries need two unique labels.</Text>
    <Button title="Add equipment" secondary onPress={()=>navigation.navigate('Equipment',{kitId})}/>
    {query.data?.items.map(item=><View key={item.id} style={s.card}>
      <View style={s.row}><GearPhoto photo={item.photo}/><View style={s.grow}><Text style={s.heading}>{item.name}</Text><Text style={s.muted}>{item.barcode}</Text></View></View>
      <Button title="Edit equipment" secondary onPress={()=>navigation.navigate('Equipment',{kitId,equipmentId:item.id})}/>
    </View>)}
    {query.data?.items.length===0&&<Text style={s.muted}>No equipment yet. Add the items you will take to your shoot.</Text>}
    <Failure message={error}/>
    <Button title={active?'Continue active shoot':'Start shoot'} disabled={!active&&!query.data?.items.length} onPress={start}/>
    <Text style={s.muted}>Starting a shoot freezes the expected list. Later kit changes apply only to new shoots.</Text>
    <Text style={s.heading}>Shoot history</Text>
    {query.data?.sessions.map(session=><View key={session.id} style={s.card}>
      <Text style={s.label}>{session.status==='active'?'ACTIVE':'COMPLETED'}</Text>
      <Text style={s.text}>{new Date(session.startedAt).toLocaleString()}</Text><Text style={s.muted}>{session.checked} / {session.total} checked</Text>
      <Button title="View shoot" secondary onPress={()=>navigation.navigate('Session',{sessionId:session.id})}/>
    </View>)}
  </ScrollView>;
}
