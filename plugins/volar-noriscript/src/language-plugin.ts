import { transpileNoriScript } from '@luently/noriscript/transpile';
import { CodeMapping, LanguagePlugin, VirtualCode } from '@volar/language-core';
import type * as ts from 'typescript';
import { URI } from 'vscode-uri';

// FIX: Volar starter

type ScriptId = URI | string;

function scriptPath(id: ScriptId | undefined) {
   if (!id) return '';
   if (typeof id === 'string') return id;
   return id.path;
}

function isNoriScriptFile(id: ScriptId | undefined, languageId: string) {
   const path = scriptPath(id);
   return languageId === 'noriscript' || path.endsWith('.nsx');
}

function isNoriScriptVirtualCode(code: VirtualCode) {
   return code.id === 'root' && code.languageId === 'typescriptreact';
}

export const noriscriptLanguagePlugin: LanguagePlugin<ScriptId> = {
   getLanguageId(scriptId) {
      if (scriptPath(scriptId).endsWith('.nsx')) {
         return 'noriscript';
      }
   },
   createVirtualCode(scriptId, languageId, snapshot) {
      if (isNoriScriptFile(scriptId, languageId)) {
         return new NoriScriptVirtualCode(scriptPath(scriptId), snapshot);
      }
   },
   typescript: {
      extraFileExtensions: [{ extension: 'nsx', isMixedContent: true, scriptKind: 4 satisfies ts.ScriptKind.TSX }],
      getServiceScript(root) {
         if (isNoriScriptVirtualCode(root)) {
            return {
               code: root,
               extension: '.tsx',
               scriptKind: 4 satisfies ts.ScriptKind.TSX,
            };
         }
      },
   },
};


function createSnapshot(text: string): ts.IScriptSnapshot {
   return {
      getText(start, end) {
         return text.slice(start, end);
      },
      getLength() {
         return text.length;
      },
      getChangeRange() {
         return undefined;
      },
   };
}


export class NoriScriptVirtualCode implements VirtualCode {
   id = 'root';
   languageId = 'typescriptreact';
   mappings: CodeMapping[] = []
   snapshot: ts.IScriptSnapshot

   constructor(filePath: string, sourceSnapshot: ts.IScriptSnapshot) {
      const length = sourceSnapshot.getLength()
      const source = sourceSnapshot.getText(0, length)
      const result = transpileNoriScript(filePath || 'virtual.nsx', source)
      this.snapshot = createSnapshot(result.transpiled.code)
      this.mappings = result.map
   }
}