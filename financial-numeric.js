/*
//=============================================================================================================
//
//		Name        : 	xDLT Engine / Financial-Numeric / JS
//		Author      : 	Joe K. Kim (JKK)
//		Site		:	https://xdlt.org
//		Version     : 	0.0.0
//		
//		!!! Proprietary !!!
//
//		© 2019 xDLT Inc. all rights reserved
//		Written by Joe K. Kim <dev@xgovern.com>
//
//=============================================================================================================
*/

var export_wrapper = (function(){
		
	const toBigIntLE = require('bigint-buffer').toBigIntLE;
	const toBufferLE = require('bigint-buffer').toBufferLE;
	const toBigIntBE = require('bigint-buffer').toBigIntBE;
	const toBufferBE = require('bigint-buffer').toBufferBE;
	toBufferLE(1n,1); toBufferBE(1n,1); //DO NOT REMOVE, somehow the first call returns a null buffer array;
	
	var BIC_max = 1n; for(var i = 0; i < 64; ++i) BIC_max *= 256n; BIC_max -= 1n;
	var BIC_1 = 1n; for(var i = 0; i < 32; ++i) BIC_1 *= 256n;
	var BIC_1_str = BIC_1 + '';
	var BIC_mult = 1000000000000000000000000000000000000000000000000000000000000000000000000000000n;
	var BIC_tens = [], BIC_temp = 1n; for(var i = 0; i < 64; ++i){BIC_tens.push(BIC_temp); BIC_temp *= 10n;} BIC_tens[0] = 0n;
	var one = BIC_1;

	//64-byte number object with [77,77] max precision, [36,36] guaranty.
	var FN = function(type,value,ver,raw){
	
		if(arguments.length === 1){value = type; type = null;}
		if(!ver) ver = 0n; if(!type) type = 'USD';
		
		if(typeof value === 'number'){
			var int_part = Math.floor(value);
			this.v = BigInt(int_part) * BIC_1;
			if(int_part != value){
				var dec = BigInt((value-int_part) * 100000000000000000);
				this.v += dec * BIC_1 / 100000000000000000n + 1n;
			}
		}
		else if(typeof value === 'string'){
			var spl = value.split('.');
			this.v = BigInt(spl[0]) * BIC_1;
			if(spl.length >= 2){
				var dec_part = spl[1];
				var front_zeros = 0; for(var i = 0; i < dec_part.length; ++i){if(dec_part[i] === '0'){++front_zeros;}else{break;}}
				var dec = BigInt(dec_part); 
				this.v += BigInt(dec) * BIC_1 / BIC_tens[dec.toString().length + front_zeros] + 1n;
			}
		}
		else if(typeof value === 'bigint'){
			if(raw) this.v = value;
			else this.v = value * BIC_1;
		}
		else{
			this.v = 0n;
		}

		//Type and Version
		this.getVersion = function(){return ver;};
		this.getCurrencyType = function(){return type;};

		//Basic Operations
		this.set = function(v){ this.v = v; this.trim(); };
		this.copy = function(_b){ this.v = _b.v; this.trim(); };
		this.trim = function(){ if(this.v < 0n) this.v = 0n; else if(this.v > BIC_max) this.v = BIC_max; };

		//Object Operations
		this.add = function(_b){ this.v += _b.v; this.trim(); return this; };
		this.sub = function(_b){ this.v -= _b.v; this.trim(); return this; };
		this.mul = function(_b){ this.v = this.v * _b.v / BIC_1; this.trim(); return this; };
		this.div = function(_b){ this.v = this.v * BIC_1 / _b.v; this.trim(); return this; };
		this.mod = function(_b){ this.v = (this.v / BIC_1) % (_b.v / BIC_1) * BIC_1; this.trim(); return this; };
	
		//Increment & Decrement
		this.incre = function(){ this.v += BIC_1; this.trim(); return this; };
		this.decre = function(){ this.v -= BIC_1; this.trim(); return this; };

		//Direct BigInt Operations
		this.add_v = function(v){ this.v += v; this.trim(); return this; };
		this.sub_v = function(v){ this.v -= v; this.trim(); return this; };
		this.mul_v = function(v){ this.v = this.v * v / BIC_1; this.trim(); return this; };
		this.div_v = function(v){ this.v = this.v * BIC_1 / v; this.trim(); return this; };
		this.mod_v = function(v){ this.v = (this.v / BIC_1) % (v / BIC_1) * BIC_1; this.trim(); return this; };

		//New Currency return;
		this.new_add = function(_b){ return new FN(type, this.v + _b.v); };
		this.new_sub = function(_b){ return new FN(type, this.v - _b.v); };
		this.new_mul = function(_b){ return new FN(type, this.v * _b.v / BIC_1); };
		this.new_div = function(_b){ return new FN(type, this.v * BIC_1 / _b.v); };
		this.new_mod = function(_b){ return new FN(type, (this.v / BIC_1) % (_b.v / BIC_1) * BIC_1); };

		//New BigInt Value return with direct BigInt operand
		this.new_add_v = function(v){ return this.v + v; };
		this.new_sub_v = function(v){ return this.v - v; };
		this.new_mul_v = function(v){ return this.v * v / BIC_1; };
		this.new_div_v = function(v){ return this.v * BIC_1 / v; };
		this.new_mod_v = function(v){ return (this.v / BIC_1) % (v / BIC_1) * BIC_1; };

		//Basic Comparisons
		this.eq = function(_b){ return typeof _b === 'bigint' ? (this.v === _b) : (this.v === _b.v); };
		this.gt = function(_b){ return typeof _b === 'bigint' ? (this.v > _b) : (this.v > _b.v); };
		this.lt = function(_b){ return typeof _b === 'bigint' ? (this.v < _b) : (this.v < _b.v); };
		this.ge = function(_b){ return typeof _b === 'bigint' ? (this.v >= _b) : (this.v >= _b.v); };
		this.le = function(_b){ return typeof _b === 'bigint' ? (this.v <= _b) : (this.v <= _b.v); };

		//To String
		this.toString = this.toJSON = this.stringify = function(full,int_digits){
			if(int_digits === true) int_digits = 36;
			if(!full) full = 36; if(full === true) full = 78;
			if(isNaN(full) || full < 0) full = 0; if(full > 78) full = 78;
			var int_part = (this.v / BIC_1) + '';
			var dec_part = ((this.v % BIC_1 + 1n) * BIC_mult / BIC_1) + '';
			while(dec_part.length < 78) dec_part = '0' + dec_part;
			dec_part = dec_part.substr(0,full);
			while(dec_part.charAt(dec_part.length-1) == '0') dec_part = dec_part.substr(0,dec_part.length-1);
			if(dec_part.charAt(dec_part.length-1) == '.') dec_part = dec_part.substr(0,dec_part.length-1);
			if(int_digits){ while(int_part.length < int_digits) int_part = '0' + int_part; }
			return dec_part.length > 0 ? int_part+'.'+dec_part : int_part;
		};
		
		//From/To Buffer
		this.toBuffer = function(buffer,offset){
			if(!buffer) buffer = Buffer.alloc(100); if(!offset) offset = 0;
			var num_part = toBufferLE(this.v,64);
			num_part.copy(buffer,offset+36);
		
			return buffer;
		}
		this.fromBuffer = function(b){
			if(!cur) cur = 'USD';
			b = toBigIntLE(b);
			return new FN(cur,b,false,true);
		}
		
		//To Base64
		this.toBase64 = function(){
			return this.toBuffer().toString('base64');
		}

	}
	
	var __pkg = {
		FN:FN
	};
	
	module.exports = __pkg;
	Object.freeze(module.exports);
    return module.exports;
})();


