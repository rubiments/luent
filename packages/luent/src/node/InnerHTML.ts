import { __DEV__checkIfTracked, Ion, toValue, isGetter, trackForRender, awaitRender, RUN_EAGERLY, queueInternalRender } from "@luently/quarky";
import { IonOr } from "../component/bindings-types";
import { DOMParent } from "./VineNode";
import { getFlask } from "@luently/flask";
import { isObject } from "@luently/utils";
import { MutableIon } from "packages/luent/dist";

export function isInnerHTMLKit(entity: any): entity is InnerHTMLKit {
  return isObject(entity) && 'html' in entity
}


export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: DOMParent) {
  //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
  const { trusted, html } = kit;
  if (isGetter(html)) {
    trackForRender(html, () => {
      queueInternalRender(() => {
        setInnerHTML(html(), trusted, parentNode)
      })
    }, getFlask(), true);
  }
  else {
    setInnerHTML(toString(html), trusted, parentNode)
  }
}

function setInnerHTML(html: string, trusted: boolean | undefined, node: DOMParent) {
  if (trusted) {
    node.innerHTML = html
  }
  else if ('setHTML' in node) {
    node.setHTML(html)
  }
  else {
    throw new Error('html must be sanitized or marked trusted')
  }
}






function toString(value: any) {
  return value == null ? "" : String(value);
}

export type InnerHTMLKit = {
  trusted?: boolean
  html: IonOr<string>
}
