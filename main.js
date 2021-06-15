

//---api
 const url =`https://vue3-course-api.hexschool.io/api/shang/`;

 //mitt
 const emitter = mitt();
 //------VeeValidate-規則
 VeeValidate.defineRule('email', VeeValidateRules['email']);
VeeValidate.defineRule('required', VeeValidateRules['required']);
//VeeValidate-多國語系
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');

// Activate the locale
VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize('zh_TW'),
  validateOnInput: true, // 調整為輸入字元立即進行驗證
});


const app = Vue.createApp({
  data(){
    return{
      products:[],
      singleProduct:{},
      cart:[],
      orderForm:{}
    }
  },
  methods:{
    getProducts(){      
       axios.get(`${url}products/all`).then(res=>{
         //把資料放進products中                 
         this.products = res.data.products;              
       })
     }, 
  },
mounted(){
    this.getProducts();    
  }
});
//--------註冊表單驗證元件
app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);
//----元件--
app.component('productList',{
   data(){
    return {             
    
    }
  },
  props:['products'],    
  methods:{   
    seeMore(id){
      emitter.emit("seeDtail",id);          
                    
    },
    addCart(id){
        
      //發送加入購物車請求
      axios.post(`${url}cart`, { "data": { "product_id":id,"qty":1 } }).then(res=>{
       if(res.data.success){
         alert(res.data.message);
         //用miit通知購物車元件，重新getcart
         emitter.emit('productIsAdd')
       }
       else{
         alert(res.data.message)
       }
      })
    }
  },
  template:`<table class="table">
  <thead>
    <tr>
      <th scope="col">圖片</th>
      <th scope="col">商品名稱</th>
      <th scope="col">價格</th>
     
    </tr>
  </thead>
  <tbody>
    <tr  v-for="(product,key) in products">
      <th ><img  style="height: 100px; background-size: cover; background-position: center" :src="product.imageUrl"></th>
      <td>{{product.title}}</td>
      <td>{{product.price}}</td>
      <td>
<button type="button" class="btn btn-secondary" @click="seeMore(product.id)">查看更多</button>
<button type="button" class="btn btn-primary" @click='addCart(product.id)'>加到購物車</button>
</td>
    </tr>   
    </tr>
  </tbody>
</table>`,
  mounted(){
   
  }  
});
app.component('singleProduct',{
    data(){
    return {
      modal:'',
      targetProduct:{},
      amount:1
    }
  },
  props:["products"],
  template:` <div class="modal fade" id="productModal" tabindex="-1" role="dialog"
       aria-labelledby="exampleModalLabel" aria-hidden="true" ref="modal">
        <div class="modal-dialog modal-xl" role="document">
          <div class="modal-content border-0">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title" id="exampleModalLabel">
                <span>{{targetProduct.title}}</span>
              </h5>
              <button type="button" class="btn-close"
                      data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-sm-6">
                  <img class="img-fluid" :src="targetProduct.imageUrl" alt="">
                </div>
                <div class="col-sm-6">
                  <span class="badge bg-primary rounded-pill">{{ targetProduct.category}} </span>
                  <p>商品描述：{{ targetProduct.description }}</p>
                  <p>商品內容：{{ targetProduct.content }}</p>
                 
                
                  <div class="h5" >現在只要 {{ targetProduct.price }} 元</div>
                  <div>
                    <div class="input-group">
                      <input type="number" class="form-control" v-model="amount"
                             min="1">
                      <button type="button" class="btn btn-primary"   @click=addCart(targetProduct.id,amount)
                            >加入購物車</button>
                    </div>
                  </div>
                </div>
               
              </div>
            </div>
          </div>
        </div>
      </div>`,
  methods:{
    showModal(){
       emitter.on("seeDtail",(id)=>{
          let loader = this.$loading.show();
              
        setTimeout(() => {
                    loader.hide()
                }, 100)     
      this.modal.show();
      this.targetProduct = this.findTargetProduct(id);     
   })
    },
    findTargetProduct(id){
      const targetProduct =this.products.filter((product)=>{
        return product.id == id
      });      
      return targetProduct[0];
    },    
    addCart(id,amount){      
       //轉換amount的型別
       amount =parseInt(amount);
      //發送加入購物車請求
       axios.post(`${url}cart`, { "data": { "product_id":id,"qty":amount } }).then(res=>{
        if(res.data.success){
          alert(res.data.message);
          //用miit通知購物車元件，重新getcart
          emitter.emit('productIsAdd');
          //amount回到預設值
          this.amount =1;
          //關閉modal
          this.modal.hide();
        }
        else{
          alert(res.data.message)
        }
       })
    }
  },   
   //生命週期 
  mounted(){
this.modal =new bootstrap.Modal(this.$refs.modal);
//在mount放置監聽 
 this.showModal();
  } 
});
app.component('cart',{
  data(){
    return {
          carts:[] ,
          totalCost:0 
              }
  }
  ,template:` <div class="text-end">
            <button class="btn btn-outline-danger" type="button" @click="deleteAll">清空購物車</button>
          </div>
          <table class="table align-middle">
            <thead>
              <tr>
                <th></th>
                <th>品名</th>
                <th style="width: 150px">數量/單位</th>
                <th>單價</th>
              </tr>
            </thead>
            <tbody>
               <template v-if="carts.length >0">
                <tr v-for="(item,key) in carts" :key="item.id">
                  <td>
                    <button type="button" class="btn btn-outline-danger btn-sm" @click='deleteTargetCart(item.id)'
                     >                     
                      x
                    </button>
                  </td>
                  <td>
                     {{item.product.title }}                  
                  </td>
                  <td>
                    <input v-model.number="item.qty"
                           min="1" type="number" class="form-control"@blur="updateCartQty(item.id,item.product_id,item.qty)">
                        <span class="input-group-text" >{{ item.product.unit }}</span>                  
                  </td>
                  <td class="text-end">
                  
                  {{item.final_total}} 
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end">總計</td>
                <td class="text-end"> {{totalCost }}</td>
              </tr>              
            </tfoot>
          </table>
        </div>`,
  methods:{   
    getCart(){
      axios.get(`${url}cart`).then(res=>{
        if(res.data.success){
           let loader = this.$loading.show();
              
        setTimeout(() => {
                    loader.hide()
                }, 100)     
          
          this.carts =res.data.data.carts;
          this.totalCost =res.data.data.total;          
        }
        else{
          alert(res.data.message)
        }
      })
    },
    updateCartQty(cartId,ProductId,qty){
       
      //發送修改購物車的請求
       axios.put(`${url}cart/${cartId}`, { "data": { "product_id":ProductId,"qty":qty } }).
       then(res=>{
        if(res.data.success){
           alert(res.data.message);
           //重新取得購物車的資料
           this.getCart();           
        }else{
          alert(res.data.message)
        }
       })
    },
    deleteTargetCart(cartId){
        let loader = this.$loading.show();
              
        setTimeout(() => {
                    loader.hide()
                }, 100) 
      axios.delete(`${url}cart/${cartId}`).
      then(res=>{
        if(res.data.success){
          alert(res.data.message);
          //重新取得cart的資料
          this.getCart()          
        }else{
          alert(res.data.message)
        }
      })
    },deleteAll(){
        let loader = this.$loading.show();
              
        setTimeout(() => {
                    loader.hide()
                }, 100) 
      
      axios.delete(`${url}carts`).
      then(res=>{
        if(res.data.success){
            let loader = this.$loading.show();
        
          alert("購物車已清空");
          //重新取得cart的資料
          this.getCart()          
        }else{
          alert(res.data.message)
        }
      })
    }

  } ,
  mounted(){
     //初始化進入頁面，取得購物車的資料
     this.getCart();       
     //監聽加入購物車的行為，觸發重新取得溝務車資料
    emitter.on('productIsAdd',()=>{
      this.getCart()
    })
   
  }
});
app.component('orderForm',{
  
  data(){
    return {
         user:{
            "name": "",
          "email": "",
          "tel": "",
          "address": ""
                    }  ,
         message:""
            
    }

  }
  ,template:` 
          <v-form v-slot="{ errors }" @submit="onSubmit"  class="col-md-6" >
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <v-field id="email" name="email" type="email" class="form-control"
                 placeholder="請輸入 Email" 
                 :class="{ 'is-invalid': errors['email'] }" rules="email|required" 
                 v-model="user.email"
               ></v-field> 
               <error-message name="email" class="invalid-feedback"></error-message>            
            </div>
            <div class="mb-3">
              <label for="name" class="form-label">收件人姓名</label>
              <v-field id="name" name="姓名" type="text" class="form-control" 
                placeholder="請輸入姓名"
                :class="{ 'is-invalid': errors['姓名'] }" rules="required" 
                 v-model="user.name"></v-field>  
                 <error-message name="姓名" class="invalid-feedback"></error-message>            
            </div>
            <div class="mb-3">
              <label for="tel" class="form-label">收件人電話</label>
              <v-field id="tel" name="電話" type="text" class="form-control" 
                placeholder="請輸入電話"
                 :class="{ 'is-invalid': errors['電話'] }"  :rules="isPhone"
                 v-model="user.tel"></v-field>    
                <error-message name="電話" class="invalid-feedback"></error-message>            
            </div>

            <div class="mb-3">
              <label for="address" class="form-label">收件人地址</label>
              <v-field id="address" name="地址" type="text" class="form-control" 
                placeholder="請輸入地址" 
                 :class="{ 'is-invalid': errors['地址'] }" rules="required" 
                 v-model="user.address" ></v-field>
                   <error-message name="地址" class="invalid-feedback"></error-message>            
            </div>
            <div class="mb-3">
              <label for="message" class="form-label">留言</label>
              <textarea name="" id="message" class="form-control" cols="30" rows="10" v-model="message"
              ></textarea>
            </div>
            <div class="text-end">
              <button type="submit" class="btn btn-danger">送出訂單</button>
            </div>
          </v-form>
        `,
  methods:{   
     isPhone(value) {
    const phoneNumber = /^(09)[0-9]{8}$/
    return phoneNumber.test(value) ? true : '需要正確的電話號碼'
  }, onSubmit() {
    
   //成立訂單
  const user=this.user;
  const message=this.message;
  axios.post(`${url}order`,{data: {
        user,
        message
      }}).then(res=>{
        if(res.data.success){
           let loader = this.$loading.show();
              
        setTimeout(() => {
                    loader.hide()
                }, 100)     
           alert(res.data.message)
        }else{
          alert(res.data.message)
        }
      }) 
  },
  }   

})

//---------使用loading套件
app.use(VueLoading);
app.mount('#app')