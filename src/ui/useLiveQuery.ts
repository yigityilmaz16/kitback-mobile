import { useCallback,useEffect,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { message } from './components';
export function useLiveQuery<T>(query:()=>T) {
  const ref=useRef(query); ref.current=query;
  const [data,setData]=useState<T|null>(null);
  const [error,setError]=useState<string|null>(null);
  const reload=useCallback(()=>{
    try{setData(ref.current());setError(null);}catch(e){setError(message(e));}
  },[]);
  useFocusEffect(useCallback(()=>{reload();},[reload]));
  useEffect(()=>{const listener=AppState.addEventListener('change',state=>{if(state==='active')reload();});return()=>listener.remove();},[reload]);
  return {data,error,reload};
}
