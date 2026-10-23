import { style } from "luent";

export function TestOStyle() {
  return <>
    <div class='allo'>Hello world</div>

    {style`
      .allo {
        background-color: pink;
        color: purple;
      }
    `}
  </>
}