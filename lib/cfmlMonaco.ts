type Monaco = typeof import('monaco-editor');

const FLAG = '__leaflyteCfml';

const CF_TAGS =
  'cfabort|cfajaximport|cfajaxproxy|cfapplet|cfapplication|cfargument|cfassociate|cfbreak|cfcache|cfcalendar|cfcase|cfcatch|cfchart|cfchartdata|cfchartseries|cfclient|cfclientsettings|cfcol|cfcollection|cfcomponent|cfcontent|cfcookie|cfdbinfo|cfdefaultcase|cfdirectory|cfdiv|cfdocument|cfdocumentitem|cfdocumentsection|cfdump|cfelse|cfelseif|cferror|cfexecute|cfexit|cffeed|cffile|cffileupload|cffinally|cfflush|cfform|cfformgroup|cfformitem|cfftp|cffunction|cfgrid|cfgridcolumn|cfgridrow|cfgridupdate|cfheader|cfhtmlbody|cfhtmlhead|cfhttp|cfhttpparam|cfif|cfimage|cfimap|cfimport|cfinclude|cfindex|cfinput|cfinsert|cfinterface|cfinvoke|cfinvokeargument|cflayout|cflayoutarea|cfldap|cflocation|cflock|cflog|cflogin|cfloginuser|cflogout|cfloop|cfmail|cfmailparam|cfmailpart|cfmap|cfmediaplayer|cfmenu|cfmenuitem|cfmodule|cfobject|cfoutput|cfparam|cfpdf|cfpod|cfpop|cfprocessingdirective|cfprocparam|cfprocresult|cfproperty|cfqueryparam|cfregistry|cfreport|cfrethrow|cfreturn|cfsavecontent|cfschedule|cfsearch|cfselect|cfset|cfsetting|cfsilent|cfspreadsheet|cfstoredproc|cfswitch|cftable|cftextarea|cfthread|cfthrow|cftimer|cftooltip|cftrace|cftransaction|cftree|cftreeitem|cftry|cfupdate|cfwddx|cfwebsocket|cfwindow|cfxml|cfzip|cfzipparam';

const SCRIPT_KEYWORDS =
  'abort|abstract|any|array|as|boolean|break|case|catch|component|contains|continue|default|do|does|else|eq|eqv|extends|false|final|finally|for|function|gt|gte|if|imp|import|include|instanceof|interface|is|lt|lte|mod|new|neq|not|null|numeric|or|package|param|private|property|public|query|remote|required|rethrow|return|static|string|struct|switch|this|throw|true|try|var|void|while|xor|xml';

const SQL_KEYWORDS =
  'select|from|where|and|or|inner|left|right|outer|join|on|group|by|order|insert|into|values|update|set|delete|as|in|not|null|like|limit|offset|having|union|all|distinct|case|when|then|else|end|exists|between|is|asc|desc|count|sum|avg|min|max|top|with';

const HASH: [RegExp, string] = [/#(?:##|[^#\r\n]+)#/, 'variable.hash'];

export function ensureCfmlLanguage(monaco: Monaco) {
  const g = monaco as Monaco & { [FLAG]?: boolean };
  if (g[FLAG]) return;
  g[FLAG] = true;

  monaco.languages.register({
    id: 'cfml',
    extensions: ['.cfm', '.cfc', '.cfml', '.cfs', '.cfr'],
    aliases: ['CFML', 'ColdFusion', 'Adobe ColdFusion', 'Lucee', 'cfml']
  });

  monaco.languages.setLanguageConfiguration('cfml', {
    comments: {
      blockComment: ['<!---', '--->'],
      lineComment: '//'
    },
    brackets: [
      ['<!--', '-->'],
      ['<!---', '--->'],
      ['<', '>'],
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '<!---', close: '--->' }
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '<', close: '>' }
    ],
    folding: {
      markers: {
        start:
          /^\s*<(cfif|cfloop|cfoutput|cfquery|cfscript|cfcomponent|cffunction|cfswitch|cftry|cfsavecontent|cflock|cfmail|cfform)\b/i,
        end: /^\s*<\/(cfif|cfloop|cfoutput|cfquery|cfscript|cfcomponent|cffunction|cfswitch|cftry|cfsavecontent|cflock|cfmail|cfform)\s*>/i
      }
    }
  });

  monaco.languages.setMonarchTokensProvider('cfml', {
    defaultToken: '',
    tokenPostfix: '.cfml',
    ignoreCase: true,
    tokenizer: {
      root: [
        [/<!---/, 'comment', '@cfComment'],
        [/<!--/, 'comment', '@htmlComment'],
        [/(^|\n)\s*(component|interface)\b/, { token: 'keyword.cfml', next: '@cfScript' }],
        [/<cfscript\b/, { token: 'tag.cfml', next: '@cfScriptOpen' }],
        [/<\/cfscript\s*>/, 'tag.cfml'],
        [/<cfquery\b/, { token: 'tag.cfml', next: '@cfQueryOpen' }],
        [/<\/cfquery\s*>/, 'tag.cfml'],
        [new RegExp(`</?(?:${CF_TAGS})(?=\\s|/|>)`), { token: 'tag.cfml', next: '@cfTag' }],
        [/<\/?[a-zA-Z][\w:.-]*/, { token: 'tag', next: '@htmlTag' }],
        HASH,
        [/[^<#]+/, '']
      ],

      cfComment: [
        [/--->/, 'comment', '@pop'],
        [/[^-]+/, 'comment'],
        [/./, 'comment']
      ],

      htmlComment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment'],
        [/./, 'comment']
      ],

      cfTag: [
        [/\/>/, { token: 'tag.cfml', next: '@pop' }],
        [/>/, { token: 'tag.cfml', next: '@pop' }],
        [/\s+/, ''],
        [/[\w.:-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        HASH
      ],

      htmlTag: [
        [/\/>/, { token: 'tag', next: '@pop' }],
        [/>/, { token: 'tag', next: '@pop' }],
        [/\s+/, ''],
        [/[\w.:-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle']
      ],

      cfScriptOpen: [
        [/\/>/, { token: 'tag.cfml', next: '@pop' }],
        [/>/, { token: 'tag.cfml', next: '@cfScript' }],
        [/\s+/, ''],
        [/[\w.:-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        HASH
      ],

      cfQueryOpen: [
        [/\/>/, { token: 'tag.cfml', next: '@pop' }],
        [/>/, { token: 'tag.cfml', next: '@cfQuery' }],
        [/\s+/, ''],
        [/[\w.:-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        HASH
      ],

      stringDouble: [
        HASH,
        [/[^\\"#]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ],

      stringSingle: [
        HASH,
        [/[^\\'#]+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop']
      ],

      cfScript: [
        [/<\/cfscript\s*>/, { token: 'tag.cfml', next: '@pop' }],
        [/<!---/, 'comment', '@cfComment'],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@scriptBlockComment'],
        HASH,
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        [/\d+(\.\d+)?/, 'number'],
        [new RegExp(`\\b(?:${SCRIPT_KEYWORDS})\\b`), 'keyword.cfml'],
        [/[{}()[\]]/, 'delimiter.bracket'],
        [/[;,.]/, 'delimiter'],
        [/[a-zA-Z_]\w*/, 'identifier']
      ],

      scriptBlockComment: [
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment']
      ],

      cfQuery: [
        [/<\/cfquery\s*>/, { token: 'tag.cfml', next: '@pop' }],
        [/<!---/, 'comment', '@cfComment'],
        HASH,
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        [new RegExp(`\\b(?:${SQL_KEYWORDS})\\b`), 'keyword'],
        [/[a-zA-Z_]\w*/, 'identifier']
      ]
    }
  });
}
