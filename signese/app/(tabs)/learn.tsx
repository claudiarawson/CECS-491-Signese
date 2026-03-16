import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");
const MAP_WIDTH = Math.min(420, width - 20);
const CENTER = MAP_WIDTH / 2;

export default function Learn() {

const lessons = [
{ title: "Greetings", emoji: "👋", top: 120, left: CENTER + 30 },
{ title: "Numbers", emoji: "🔢", top: 260, left: CENTER - 90 },
{ title: "Colors", emoji: "🎨", top: 420, left: CENTER + 30 },
{ title: "Telling Time", emoji: "⏰", top: 600, left: CENTER - 90 },
{ title: "Food & Drink", emoji: "🍔", top: 780, left: CENTER + 30 },
];

return (
<View style={styles.container}>

{/* Gradient Background */}
<Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
<Defs>
<LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
<Stop offset="0%" stopColor="#d6c8f2" stopOpacity="1" />
<Stop offset="100%" stopColor="#a8d8e8" stopOpacity="1" />
</LinearGradient>
</Defs>

<Path
d={`M0 0 H${width} V1200 H0 Z`}
fill="url(#bgGradient)"
/>
</Svg>

<ScrollView
contentContainerStyle={styles.scroll}
showsVerticalScrollIndicator={false}
>

<View style={[styles.map,{width:MAP_WIDTH}]}>

{/* Road */}
<Svg height="1000" width={MAP_WIDTH} style={styles.road}>
<Path
d={`
M${CENTER} 40
C${CENTER+90} 140, ${CENTER-90} 240, ${CENTER} 320
C${CENTER+90} 420, ${CENTER-90} 520, ${CENTER} 600
C${CENTER+90} 700, ${CENTER-90} 800, ${CENTER} 900
`}
stroke="#63c0b5"
strokeWidth="60"
fill="none"
strokeLinecap="round"
/>
</Svg>

{/* Lesson bubbles */}
{lessons.map((lesson,index)=>(
<View
key={index}
style={[
styles.bubble,
{top:lesson.top,left:lesson.left}
]}
>
<Text style={styles.emoji}>{lesson.emoji}</Text>
<Text style={styles.label}>{lesson.title}</Text>
</View>
))}

</View>
</ScrollView>
</View>
);
}

const styles = StyleSheet.create({

container:{
flex:1
},

scroll:{
alignItems:"center",
paddingTop:40,
paddingBottom:120
},

map:{
height:1000
},

road:{
position:"absolute"
},

bubble:{
position:"absolute",
width:110,
height:110,
borderRadius:55,
backgroundColor:"#f2f2f2",
justifyContent:"center",
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.25,
shadowRadius:6,
elevation:4
},

emoji:{
fontSize:28
},

label:{
fontSize:12,
marginTop:4
}

});