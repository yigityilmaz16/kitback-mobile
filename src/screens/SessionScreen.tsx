import { Alert,ScrollView,Text,View } from 'react-native';
import { useState } from 'react';
import { useRepository } from '../data/context';
import { Button,Failure,GearPhoto,Loading,message } from '../ui/components';
import { styles as s } from '../ui/theme';
import { useLiveQuery } from '../ui/useLiveQuery';
import type { ScreenProps } from '../navigation';
export function SessionScreen({navigation,route}:ScreenProps<'Session'>) {
  const {sessionId}=route.params;const repo=useRepository();const [error,setError]=useState<string|null>(null);
  const query=useLiveQuery(()=>({session:repo.session(sessionId),items:repo.snapshot(sessionId)}));
  function finish(){try{repo.finishSession(sessionId);query.reload();}catch(e){setError(message(e));}}
  function undo(id:number){Alert.alert('Mark as not checked?','You will need to check this item again.',[
    {text:'Cancel',style:'cancel'},{text:'Undo check',onPress:()=>{try{repo.uncheck(sessionId,id);query.reload();}catch(e){setError(message(e));}}}
  ]);}
  const session=query.data?.session;const missing=query.data?.items.filter(x=>!x.checkedAt)??[];
  return <ScrollView style={s.page} contentContainerStyle={s.content}>
    <Failure message={query.error} retry={query.reload}/>{!query.data&&!query.error&&<Loading/>}
    {session&&<>
      <Text style={s.label}>{session.status==='completed'?'SHOOT COMPLETED':'SHOOT IN PROGRESS'}</Text>
      <Text style={s.title}>{session.kitName}</Text>
      <Text style={s.count}>{session.checked} / {session.total}</Text><Text style={s.text}>checked</Text>
      {missing.length===0?<View style={s.card}><Text style={s.heading}>Everything is checked.</Text>
        <Text style={s.muted}>A scan confirms your check, not that the item is physically packed.</Text>
        {session.status==='active'&&<Button title="Complete shoot" onPress={finish}/>}</View>
        :<><Text style={s.heading}>Not checked yet · {missing.length}</Text>
          <Text style={s.muted}>Find these items before leaving the shoot.</Text>
          {missing.map(item=><View key={item.id} style={[s.card,s.row]}><GearPhoto photo={item.photo}/><Text style={[s.heading,s.grow]}>{item.name}</Text></View>)}
          {session.status==='active'&&<Button title="Return check · scan gear" onPress={()=>navigation.navigate('ReturnCheck',{sessionId})}/>}
        </>}
      <Failure message={error}/>
      <Text style={s.heading}>Checked equipment</Text>
      {query.data?.items.filter(x=>x.checkedAt).map(item=><View key={item.id} style={s.card}>
        <View style={s.row}><GearPhoto photo={item.photo}/><View style={s.grow}><Text style={s.text}>{item.name}</Text><Text style={s.label}>CHECKED</Text></View></View>
        {session.status==='active'&&<Button title="Undo check" secondary onPress={()=>undo(item.id)}/>}
      </View>)}
      <Text style={s.muted}>Expected list captured {new Date(session.startedAt).toLocaleString()}.</Text>
    </>}
  </ScrollView>;
}
