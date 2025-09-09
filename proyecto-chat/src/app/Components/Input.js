"use client"

export default function Input(props){
    return(
        <>
            <input className={props.className} type={props.type} value={props.value} onChange={props.onChange} placeholder={props.placeholder}>{props.text}</input>
        </>
    )
}