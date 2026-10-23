import { style } from "luent";
export function TestStyleComments() {
  return <>
    <div>Hello world</div>
    {style`
      div {
        color: red;
        // opacity: .5;
        background-color: beige;
      }  
    `}
  </>
}