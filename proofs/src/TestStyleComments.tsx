import { css } from "luent";
export function TestStyleComments() {
  return <>
    <div>Hello world</div>
    <o-style>{css`
      div {
        color: red;
        // opacity: .5;
        background-color: beige;
      }  
    `}</o-style>
  </>
}