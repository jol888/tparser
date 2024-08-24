
// @class TinyParserConfig
// strictMode: Bool = false;

class Element {
	innerHTML;
	innerText;
	children;
	father;
	id;
	className;
	attributes;
	tagName;
	pos;

	constructor(_tagName = "", father, attr = {}) {
		this.tagName = _tagName;
		this.father = father;
		this.attributes = attr;
		this.children = [];
		this.innerText = attr?.innerText || '';
		this.className = attr?.className || '';
		this.id = attr?.id;
	}
}
module.exports.TinyParser =  class TinyParser {
	#s;
	constructor(s,config) { 
		this.strictMode = config?.strictMode;
		this.#s = s;
		this.pool = []
		this.psz = 0;
	}
	pool=[];
	#psz=0;


	fromString(s) {
		if(!s instanceof String) throw "TinyParser: Argument is Not a String.";
		let c=s.matchAll(/<\s*([^>\s]+)\s*([^>]*)>/g);
		let applyNode=(t,f,a) =>{
			this.pool[++this.psz] = new Element(t,f,a);
			return this.psz;
		}
		let stack = [applyNode("root"+Math.random(),0)],pt = 0;
		let end = ()=>{
			let t=stack.pop();
			if(stack.length) this.pool[stack[stack.length-1]].children.push(t);
		}
		function parseAttr(e) {
			let ret = {};
			e=' '+e+' '
			e=e.replaceAll(/\\"/g,"&**quot;")
//			console.log(e);
			let l = e.matchAll(/([^"=\s]+)(\s*=\s*"([^"]+)")?/g);
			for(let i of l) ret[i[1]] = i[3] && i[3].replaceAll("&**quot;",'"');
			return ret;
		}
		for(let e of c) {
			// e = ["<a href>","a","href",index=10];
			let [raw, tagName, attr] = e;
			let index = e.index;
			let gap = s.substring(pt, index);
			if(gap.trim() != '') {
				stack.push(applyNode('',stack.length-1,{innerText: gap}));
				end();
			}
			pt = index + raw.length;
			if(e[1].startsWith('/')) {
				tagName = tagName.slice(1).trim();
				let st = stack.findLastIndex(e=>this.pool[e].tagName==tagName);
				if(st!=stack.length-1) {
					if(this.strictMode) throw "TinyParser: Unexpected closing tag at "+index+tagName+st+stack.map(e=>this.pool[e].tagName);
				}
				if(st == -1) {
					if(this.strictMode) throw "TinyParser: Weird Closing Tag.";
					continue;
				}
				while(stack.length>st) end();
			} else {
				stack.push(applyNode(tagName,stack.length-1,parseAttr(attr)));
				if(raw.endsWith('/>')||['br','meta','link','img'].some(e=>e==tagName)||raw.startsWith('<!--')) end();
			}
		}
		while(stack.length) end();
		let dfs=(u)=>{
			if(this.pool[u].tagName == 'br') this.pool[u].innerText = "\n";
			this.pool[u].innerHTML = ``;
			for(let v of this.pool[u].children) {
				dfs(v);
				this.pool[u].innerText += this.pool[v].innerText;
				this.pool[u].innerHTML += `<${this.pool[v].tagName}> ${this.pool[v].innerHTML} </${this.pool[v].tagName}>`;
			}
			if(this.pool[u].children.length == 0) this.pool[u].innerHTML = this.pool[u].innerText;
		}
		dfs(1);
	}
};


