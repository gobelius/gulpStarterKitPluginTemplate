
class SearchTableHelper{
	constructor(tableId,tag,config){
		if(!config) throw "No config provided";
		if(!tableId) throw "No tableId provided";
		this.table = document.getElementById(tableId);
		if(!this.table) throw "Cant find table with ID that was provided";
		this.config = config;
		this.tag=tag;
		this.init();
	}

	init(){
		this.table.innerHTML="";
		this.renderHeader();
		this.renderBody();
	}

	renderHeader(){
		if(!this.config.columns) throw "No columns are indicated in the config";
		this.thead = this._create('thead',this.table);
		this.config.columns.forEach(colConfig=>{
			let classes = [];
			if(colConfig.type == "date")
				classes=["text-center"];
			else if(colConfig.type == "number")
				classes=["text-right"];
			else classes=["text-left"];
			let th = this._create('th',this.thead,colConfig.header,classes);
			if(colConfig.width)
			th.style.width = colConfig.width;
		});

		if(this.config.options.showEditButton)
			this._create('th',this.thead,"Edit",["editColumn"]);

		if(this.config.options.showDeleteButton)
			this._create('th',this.thead,"Delete",["deleteColumn"]);
	}

	renderBody(){
		this.tbody = this._create("tbody",this.table);
		let t= this;
		this.tbody.onscroll=e=>{
			if(t.tbody.scrollTop / t.tbody.scrollHeight > 0.8)
				t._fetchNextPage();
		};
	}

	search(filter){

		if(filter && !filter.index) console.warning("Search isnt using indexes");

		this.tbody.innerHTML='';
		this._create('tr',this.tbody,'<td colspan="99"> searching...</td>',["loadingRow"]);
		this.filter=filter;
		this._fetchPageOfData(0);

	}

	_fetchNextPage(){
		console.error("_fetchNextPage");
		if(this.fetchingNextPage)return;
		this.fetchingNextPage=true;
		let t=this;
		this._fetchPageOfData(this.filter,this.pageIndex+1,()=>{
			t.fetchingNextPage = false;
		});
	}

	_fetchPageOfData(filter,pageIndex,callback){

		if(pageIndex>0 && this.endReached) return;
		let pageSize = 1;
		this.pageIndex=pageIndex;
		let options={
			filter:filter
			//,sort:{"rank":1 , "lastName":-1 }
			,page: pageIndex
			,pageSize:pageSize
		};

		this.searchOptions=options;
		buildfire.publicData.search(options,this.tag,(e,results)=>{
			if(e && callback) return callback(e);
			this.tbody.innerHTML='';
			results.forEach(r=>this.renderRow(r));
			this.endReached = results.length < pageSize;
			if(callback)callback();
		});
	}

	renderRow(obj,tr){
		if(tr) //uesed to update a row
			tr.innerHTML='';
		else
			tr = this._create('tr',this.tbody);
		tr.setAttribute("objId",obj.id);
		this.config.columns.forEach(colConfig=>{
			let classes = [];
			if(colConfig.type == "date")
				classes=["text-center"];
			else if(colConfig.type == "number")
				classes=["text-right"];
			else classes=["text-left"];
			let data = obj.data;///needed for the eval statement next
			let td=this._create('td',tr,eval("`" + colConfig.data + "`"),classes);
			if(colConfig.width)
				td.style.width = colConfig.width;
		});

		let t=this;
		if(this.config.options.showEditButton) {
			let td =this._create('td', tr, "<span class='glyphicon glyphicon-pencil'></span>", ["editColumn"]);
			td.onclick=()=>{
				t.onEditRow(obj,tr);
			};
		}

		if(this.config.options.showDeleteButton) {
			let td = this._create('td', tr, "<span class='glyphicon glyphicon-remove'></span>", ["editColumn"]);
			td.onclick=()=>{
				buildfire.notifications.confirm({
					title:"Are you sure?"
					,message:"Are you sure to delete this record?"
					,confirmButton: {text: 'Yes', key:'yes', type: 'danger'}
					,cancelButton: {text: 'No', key:'no', type: 'default'}
				},function(e,data){
					if(e) console.error(e);

					if(data.selectedButton.key =="yes") {
						tr.classList.add("hidden");
						buildfire.publicData.update(obj.id,{$set:{deletedOn:new Date()}},this.tag,e=>{
							if(e)
								tr.classList.remove("hidden");
							else
								t.onRowDeleted(obj,tr);
						});

					}
				});

			};
		}
		this.onRowAdded(obj,tr);
	}

	onSearchSet(options){
		return options;
	}
	onRowAdded(obj, tr){}

	onEditRow(obj,tr){
		console.log("Edit row",obj);
	}

	onRowDeleted(obj,tr){
		console.log("Record Delete",obj);
	}

	_create(elementType,appendTo,innerHTML,classNameArray){
		let e = document.createElement(elementType);
		if(innerHTML) e.innerHTML = innerHTML;
		if(Array.isArray(classNameArray))
			classNameArray.forEach(c=>e.classList.add(c));
		if(appendTo) appendTo.appendChild(e);
		return e;
	}


}