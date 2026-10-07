/* A short title control registered through the public CMS field API. */
(() => {
  const hex=value=>/^#[0-9a-f]{6}$/i.test(value || '')?value.toLowerCase():'';
  const markup=html=>{
    const input=document.createElement('template');input.innerHTML=DOMPurify.sanitize(html,{ALLOWED_TAGS:['strong','b','em','i','span','font','br','div','p'],ALLOWED_ATTR:['data-title-color','color','style'],ALLOW_DATA_ATTR:false});
    const render=node=>{
      if(node.nodeType===3){const span=document.createElement('span');span.textContent=node.data;return span.innerHTML;}
      if(node.nodeType!==1)return '';
      const text=[...node.childNodes].map(render).join(''),tag=node.tagName.toLowerCase();
      if(tag==='br')return '<br>';
      if(['strong','b'].includes(tag))return '<strong>'+text+'</strong>';
      if(['em','i'].includes(tag))return '<em>'+text+'</em>';
      const swatch=node.style.color||node.getAttribute('color')||node.getAttribute('data-title-color');
      let color=hex(swatch);const rgb=swatch?.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);if(rgb&&rgb.slice(1).every(n=>Number(n)<=255))color='#'+rgb.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join('');
      if(color)return '<span data-title-color="'+color+'">'+text+'</span>';
      return text+(['div','p'].includes(tag)?'<br>':'');
    };
    return [...input.content.childNodes].map(render).join('').replace(/(?:<br>)+$/,'');
  };
  window.ElyTitle={register:()=>{
    const {createElement:h,useRef,useEffect,useState,useImperativeHandle}=CMS.React;
    const Title=({forID,value,onChange,field,ref})=>{
      const input=useRef(null),selection=useRef(null),last=useRef(null),snapshot=useRef(''),props=useRef(null),composing=useRef(false);
      props.current={onChange};const [selected,setSelected]=useState(false),[message,setMessage]=useState('');
      useImperativeHandle(ref,()=>({isValid:value=>!field.get('required',true)||!!ElyArticle.plain(value)||{error:{message:'Inserisci il titolo.'}}}),[field]);
      useEffect(()=>{
        if(!input.current||value===last.current)return;
        input.current.innerHTML=ElyArticle.heading(value || '');input.current.querySelectorAll('span[data-title-color]').forEach(span=>{const font=document.createElement('font');font.color=span.getAttribute('data-title-color');font.append(...span.childNodes);span.replaceWith(font);});snapshot.current=input.current.innerHTML;last.current=value;
      },[value]);
      const publish=()=>{if(composing.current||!input.current||input.current.innerHTML===snapshot.current)return;snapshot.current=input.current.innerHTML;const next=ElyArticle.plain(input.current.innerHTML)?markup(input.current.innerHTML):'';last.current=next;props.current.onChange(next);};
      const remember=()=>{
        const native=window.getSelection(),range=native?.rangeCount?native.getRangeAt(0):null;
        if(range&&input.current?.contains(range.commonAncestorContainer)){selection.current=range.cloneRange();setSelected(!range.collapsed);}else setSelected(false);
      };
      useEffect(()=>{document.addEventListener('selectionchange',remember);return()=>document.removeEventListener('selectionchange',remember);},[]);
      const restore=()=>{const range=selection.current;if(!range||!input.current?.contains(range.commonAncestorContainer))return false;input.current.focus({preventScroll:true});const native=window.getSelection();native.removeAllRanges();native.addRange(range);return true;};
      const command=(name,color)=>{
        remember();
        if(!restore())return;
        if(name==='foreColor'&&selection.current.collapsed){setMessage('Seleziona la parola o la frase da colorare.');return;}
        document.execCommand('styleWithCSS',false,false);document.execCommand(name,false,color || null);publish();remember();setMessage('');
      };
      const button=(label,text,action,disabled=false)=>h('button',{type:'button','aria-label':label,title:label,disabled,onMouseDown:event=>event.preventDefault(),onClick:action},text);
      return h('div',{className:'ely-title-editor'},
        h('div',{className:'ely-title-tools',role:'toolbar','aria-label':'Formattazione del titolo'},
          button('Grassetto',h('strong',{},'B'),()=>command('bold')),
          button('Corsivo',h('em',{},'I'),()=>command('italic')),
          ...[['#9f4933','Argilla'],['#254535','Verde foresta'],['#286274','Blu oceano']].map(([color,label])=>h('button',{type:'button',className:'ely-title-swatch','aria-label':'Colore '+label,title:'Colore '+label,disabled:!selected,onMouseDown:event=>event.preventDefault(),onClick:()=>command('foreColor',color)},h('span',{'aria-hidden':'true',style:{backgroundColor:color}}))),
          h('label',{className:'ely-title-custom-color',title:'Scegli il colore del testo selezionato'},'Colore',h('input',{type:'color','aria-label':'Colore personalizzato del titolo',defaultValue:'#9f4933',disabled:!selected,onPointerDown:remember,onChange:event=>command('foreColor',event.target.value)})),
          button('Rimuovi formattazione','Cancella formato',()=>command('removeFormat'),!selected)
        ),
        h('div',{id:forID,ref:input,contentEditable:true,suppressContentEditableWarning:true,role:'textbox','aria-label':'Titolo','aria-multiline':'false',className:'ely-title-input',onInput:publish,onBlur:publish,onCompositionStart:()=>{composing.current=true},onCompositionEnd:()=>{composing.current=false;publish()},onKeyDown:event=>{if(event.isComposing)return;if(event.key==='Enter'){event.preventDefault();return;}if((event.ctrlKey||event.metaKey)&&['b','i'].includes(event.key.toLowerCase())){event.preventDefault();command(event.key.toLowerCase()==='b'?'bold':'italic');}},onPaste:event=>{event.preventDefault();restore();document.execCommand('insertText',false,event.clipboardData.getData('text/plain').replace(/\s*\n\s*/g,' '));publish();}}),
        h('p',{className:'ely-title-hint'},'Seleziona il testo per applicare un colore.'),
        h('span',{role:'status',className:'ely-title-status'},message)
      );
    };
    CMS.registerFieldType('ely-title',Title,({value})=>h('span',{dangerouslySetInnerHTML:{__html:ElyArticle.heading(value)}}));
  }};
})();
