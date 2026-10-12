import { css } from "luent";

export function TestOStyle() {
  return <>
    <div class='allo'>Hello world</div>

    <o-style>{css`
      .allo {
        background-color: pink;
        color: purple;
      }
    `}
    </o-style>
  </>
}