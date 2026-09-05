import { useState } from 'react';
import { ScrollView,Text,View } from 'react-native';
import { useRepository } from '../data/context';
import { Button,Failure,Field,Loading,message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function HomeScreen({navigation}:ScreenProps<'Home'>) {
  const repo=useRepository(); const [name,setName]=useState(''); const [error,setError]=useState<string|null>(null);
  const query=useLiveQuery(()=>({kits:repo.kits(),active:repo.sessions().filter(x=>x.status==='active')}));
  function create(){try{const id=repo.addKit(name);setName('');setError(null);query.reload();navigation.navigate('Kit',{kitId:id});}catch(e){setError(message(e));}}
  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.label}>READY TO WRAP</Text><Text style={s.title}>Leave with less doubt.</Text>
    <Text style={s.muted}>Check your equipment before leaving the shoot.</Text>
    <Failure message={query.error} retry={query.reload}/>
    {!query.data&&!query.error&&<Loading/>}
    {query.data?.active.map(session=><View key={session.id} style={s.card}>
      <Text style={s.label}>CONTINUE SHOOT</Text><Text style={s.heading}>{session.kitName}</Text>
      <Text style={s.text}>{session.checked} / {session.total} checked</Text>
      <Button title="Resume return check" onPress={()=>navigation.navigate('ReturnCheck',{sessionId:session.id})}/>
    </View>)}
    <Text style={s.heading}>Your kits</Text>
    {query.data?.kits.length===0&&<Text style={s.muted}>Create your first kit, then add each physical item with its own unique identifier.</Text>}
    {query.data?.kits.map(kit=><View key={kit.id} style={s.card}>
      <Text style={s.heading}>{kit.name}</Text><Text style={s.muted}>{kit.itemCount} physical items</Text>
      <Button secondary title="Open kit" onPress={()=>navigation.navigate('Kit',{kitId:kit.id})}/>
    </View>)}
    <View style={s.card}><Text style={s.heading}>Create a kit</Text><Field label="Kit name" placeholder="Wedding Shoot" value={name} onChangeText={setName} maxLength={100}/>
      <Failure message={error}/><Button title="Create kit" onPress={create} disabled={!name.trim()}/></View>
    <Text style={s.muted}>On this device. No account. No cloud.</Text>
  </ScrollView>;
}
