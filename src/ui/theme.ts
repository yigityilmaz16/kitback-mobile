import { StyleSheet } from 'react-native';
export const colors = { bg:'#101513', card:'#1B2420', line:'#35443B', text:'#F4F8F5', muted:'#B1C3B7', green:'#B5F46A', red:'#FFB1A8', amber:'#FFDC91' };
export const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.bg}, content:{padding:20,gap:18,paddingBottom:40},
  title:{fontSize:30,fontWeight:'800',color:colors.text}, heading:{fontSize:20,fontWeight:'700',color:colors.text},
  text:{fontSize:16,lineHeight:23,color:colors.text}, muted:{fontSize:14,lineHeight:21,color:colors.muted},
  label:{fontSize:12,fontWeight:'800',letterSpacing:1.5,color:colors.green},
  card:{padding:18,gap:10,borderRadius:18,backgroundColor:colors.card,borderWidth:1,borderColor:colors.line},
  row:{flexDirection:'row',alignItems:'center',gap:12}, grow:{flex:1,gap:4},
  button:{minHeight:54,paddingHorizontal:18,paddingVertical:14,borderRadius:14,backgroundColor:colors.green,alignItems:'center',justifyContent:'center'},
  buttonText:{color:colors.bg,fontWeight:'800',fontSize:16},
  secondary:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.line},
  secondaryText:{color:colors.text}, input:{backgroundColor:colors.card,color:colors.text,borderColor:colors.line,borderWidth:1,borderRadius:12,padding:15,minHeight:54,fontSize:16},
  error:{padding:14,borderRadius:12,backgroundColor:'#412520',gap:8}, errorText:{color:colors.red,fontSize:15,lineHeight:21},
  photo:{width:58,height:58,borderRadius:12,backgroundColor:colors.line},
  count:{fontSize:54,fontWeight:'900',color:colors.green,fontVariant:['tabular-nums']},
});
