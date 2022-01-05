import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Country } from 'src/app/common/country';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { ShopFormService } from 'src/app/services/shop-form.service';
import { ShopPaymentValidator } from 'src/app/validators/shop-payment-validator';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup | undefined;
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  constructor(private formBuilder: FormBuilder, private shopService: ShopFormService, private cartService: CartService, private checkoutService: CheckoutService, private router: Router) { }

  ngOnInit(): void {

    this.reviewCartDetails();

    // read the user's email address from the browser storage
    const theEmail = JSON.parse(this.storage.getItem('userEmail')!);

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        lastName: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        email: new FormControl(theEmail, [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        country: new FormControl('', Validators.required),
        state: new FormControl('', Validators.required),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.              notOnlyWhitespace]),
        city: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        country: new FormControl('', Validators.required),
        state: new FormControl('', Validators.required),
        zipCode: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', [Validators.required]),
        nameOnCard: new FormControl('', [Validators.required, Validators.minLength(2), ShopPaymentValidator.notOnlyWhitespace]),
        cardNumber: new FormControl('', [Validators.pattern('[0-9]{16}'), Validators.required]),
        securityCode: new FormControl('', [Validators.pattern('[0-9]{3}'), Validators.required]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    });

    // populate credit card months
    const startMonth: number = new Date().getMonth() + 1;
    console.log("start month: " + startMonth);

    this.shopService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    // populate credit card years
    this.shopService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years: " + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );

    // populate countries

    this.shopService.getCountries().subscribe(
      data => {
        console.log("Retrieved countries: " + JSON.stringify(data));
        this.countries = data;
      }
    )

  }
  reviewCartDetails() {
    
    // subscribe to cartService.totalQuantity
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );

    // subscribe to cartService.totalPrice
      this.cartService.totalPrice.subscribe(
        totalPrice => this.totalPrice = totalPrice
      );
  }

  copyShippingAddressToBillingAddress(event: any) {
    if (event.target.checked) {
      this.checkoutFormGroup!.controls.billingAddress.setValue(this.checkoutFormGroup!.controls.shippingAddress.value);

      // bug fix code
      this.billingAddressStates = this.shippingAddressStates;

    } else {
      this.checkoutFormGroup?.controls.billingAddress.reset();
      
      // bug fix code
      this.billingAddressStates = [];

    }

  };

  onSubmit() {

    if (this.checkoutFormGroup!.invalid) {
      this.checkoutFormGroup!.markAllAsTouched(); // markAllAsTouched to trigger the error messages on each input field
      return;
    }
    
    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create OrderItem from cartItems
    let orderItems: OrderItem[] = cartItems.map(item => new OrderItem(item));

    // set up purchase
    let purchase = new Purchase();

    // populate purchase - customer
    purchase.customer = this.checkoutFormGroup!.controls['customer'].value;

    // populate purchase - shipping address
    purchase.shippingAddress = this.checkoutFormGroup!.controls['shippingAddress'].value;
    const shippingState: State = JSON.parse(JSON.stringify(purchase.shippingAddress!.state));
    const shippingCountry: Country = JSON.parse(JSON.stringify(purchase.shippingAddress!.country));
    purchase.shippingAddress!.state = shippingState.name;
    purchase.shippingAddress!.country = shippingCountry.name;
  
    // populate purchase - billing address
    purchase.billingAddress = this.checkoutFormGroup!.controls['billingAddress'].value;
    const billingState: State = JSON.parse(JSON.stringify(purchase.billingAddress!.state));
    const billingCountry: Country = JSON.parse(JSON.stringify(purchase.billingAddress!.country));
    purchase.billingAddress!.state = billingState.name;
    purchase.billingAddress!.country = billingCountry.name;

    // populate purchase - order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // call REST API via checkoutService
    this.checkoutService.placeOrder(purchase).subscribe(
      {
        // successful placeOrder
        next: response => {
          alert(`Your order has been retrieved.\nOrder tracking number: ${response.orderTrackingNumber}`);

          // reset the cart
          this.resetCart();
        },

        // unsuccessful placeOrder
        error: err => {
          alert(`There was an error: ${err.message}`)
        }
        
      }
    );

  };

  resetCart() {
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    // reset the form
    this.checkoutFormGroup?.reset();

    // navigate back to the main products page
    this.router.navigateByUrl("/products");
  };

  handleMonthsAndYears() {

    const creditCardFormGroup = this.checkoutFormGroup!.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup!.value.expirationYear);

    // if the current year equals to selected year, then start with the current month

    let startMonth!: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    } else {
      startMonth = 1;
    }

    this.shopService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    )

  }

  getStates(formGroupName: string) {
    
    const formGroup = this.checkoutFormGroup!.get(formGroupName);

    const countryCode = formGroup!.value.country.code;
    const countryName = formGroup!.value.country.name;

    console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} country name: ${countryName}`);

    this.shopService.getStates(countryCode).subscribe(
      data => {

        if(formGroupName === 'shippingAddress') {
          this.shippingAddressStates = data;
        } else {
          this.billingAddressStates = data;
        }

        // select first item by default
        formGroup!.get('state')?.setValue(data[0]);

      }
    );

  }

  // Getter methods for customer information
  get firstName() { return this.checkoutFormGroup!.get('customer.firstName'); }
  get lastName() { return this.checkoutFormGroup!.get('customer.lastName'); }
  get email() { return this.checkoutFormGroup!.get('customer.email'); }

  // Getter methods for shipping address
  get shippingAddressStreet() { return this.checkoutFormGroup!.get('shippingAddress.street'); }
  get shippingAddressCity() { return this.checkoutFormGroup!.get('shippingAddress.city'); }
  get shippingAddressZipCode() { return this.checkoutFormGroup!.get('shippingAddress.zipCode'); }
  get shippingAddressState() { return this.checkoutFormGroup!.get('shippingAddress.state'); }
  get shippingAddressCountry() { return this.checkoutFormGroup!.get('shippingAddress.country'); }

  // Getter methods for billing address
  get billingAddressStreet() { return this.checkoutFormGroup!.get('billingAddress.street'); }
  get billingAddressCity() { return this.checkoutFormGroup!.get('billingAddress.city'); }
  get billingAddressZipCode() { return this.checkoutFormGroup!.get('billingAddress.zipCode'); }
  get billingAddressState() { return this.checkoutFormGroup!.get('billingAddress.state'); }
  get billingAddressCountry() { return this.checkoutFormGroup!.get('billingAddress.country'); }

  // Getter methods for credit card information
  get creditCardType() { return this.checkoutFormGroup!.get('creditCard.cardType'); }
  get nameOnCard() { return this.checkoutFormGroup!.get('creditCard.nameOnCard'); }
  get cardNumber() { return this.checkoutFormGroup!.get('creditCard.cardNumber'); }
  get securityCode() { return this.checkoutFormGroup!.get('creditCard.securityCode'); }


}
