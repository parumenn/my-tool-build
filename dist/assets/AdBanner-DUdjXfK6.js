import{A as o,j as i}from"./index-D4reVrDU.js";import{r}from"./vendor-react-Dy8mW7IA.js";const l=()=>{const{showAds:s}=r.useContext(o),t=r.useRef(null);return r.useEffect(()=>{var c;if(t.current&&(t.current.innerHTML="",s)){const e=document.createElement("iframe");e.style.width="100%",e.style.height="300px",e.style.border="none",e.style.overflow="hidden",e.title="Advertisement",t.current.appendChild(e);const n=(c=e.contentWindow)==null?void 0:c.document;n&&(n.open(),n.write(`
                <!DOCTYPE html>
                <html>
                <head><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100%;}</style></head>
                <body>
                    <script async="async" data-cfasync="false" src="https://pl28654616.effectivegatecpm.com/7fc3cc745c4b31d1928e463b50abab50/invoke.js"><\/script>
                    <div id="container-7fc3cc745c4b31d1928e463b50abab50"></div>
                </body>
                </html>
            `),n.close())}},[s]),s?i.jsx("div",{className:"w-full flex justify-center my-8 min-h-[300px] items-center overflow-hidden",children:i.jsx("div",{ref:t,className:"w-full max-w-[350px]"})}):null};export{l as A};
