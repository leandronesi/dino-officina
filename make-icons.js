#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib');
let table;
function crc32(buf){if(!table){table=new Uint32Array(256);for(let n=0;n<256;n++){let q=n;for(let k=0;k<8;k++)q=(q&1)?0xedb88320^(q>>>1):q>>>1;table[n]=q>>>0;}}let c=0xffffffff;for(const b of buf)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(t,d){const l=Buffer.alloc(4),crc=Buffer.alloc(4),td=Buffer.concat([Buffer.from(t),d]);l.writeUInt32BE(d.length);crc.writeUInt32BE(crc32(td));return Buffer.concat([l,td,crc]);}
function png(w,h,rgba){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
function render(size,mask){const out=Buffer.alloc(size*size*4),cx=size/2,cy=size/2,scale=mask?.78:.93;for(let y=0;y<size;y++)for(let x=0;x<size;x++){let t=y/size,col=[Math.round(71-49*t),Math.round(169-109*t),Math.round(181-112*t)];let dx=(x-cx)/(size*scale/512),dy=(y-cy)/(size*scale/512),r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),tooth=(Math.cos(a*10)>.25);if(r<174||(r<205&&tooth))col=[239,115,93];if(r<128)col=[255,245,220];if(r<68)col=[255,203,76];if(r<24)col=[38,52,58];let i=(y*size+x)*4;out[i]=col[0];out[i+1]=col[1];out[i+2]=col[2];out[i+3]=255;}return png(size,size,out);}
[['icon-180.png',180,0],['icon-192.png',192,0],['icon-512.png',512,0],['icon-maskable-512.png',512,1]].forEach(function(j){fs.writeFileSync(path.join(__dirname,j[0]),render(j[1],j[2]));console.log('wrote '+j[0]);});
