import React from 'react';
import ReactDOM from 'react-dom';
import { Subject } from 'rxjs/';
import { debounceTime, takeUntil, filter } from 'rxjs/operators';
import './index.css';

//todo: use this class to display suggestion item
class SearchListItem extends React.Component {
  constructor(props){
    super(props);
    this.onClickHandler = this.onClickHandler.bind(this);
  }

  onClickHandler(){
    this.props.onClickHandler(this.props.item);
  }

  render(){
    return (
      <div class="autocomplete__item"
        onClick={this.onClickHandler}
      >
        {this.props.item.name}
      </div>
    )
  }
}
//todo: use this class to display suggestions
class SearchList extends React.Component {
  constructor(props){
    super(props);

    this.renderItems = this.renderItemsq.bind(this);
    this.onItemClick = this.onItemClick.bind(this);
  }

  onItemClick(item){
    this.props.onItemSelected(item);
  }

  renderItems(items = []){
    return items.map(item=>
      <SearchListItem 
        item={item}
        onClickHandler={this.onItemClick}
      />
    );
  }

  render(){
    return(
      <div id={this.props.idPrefix}
        class="autocomplete__items"
      >
        {this.renderItems(this.props.items)}
      </div>
    )
  }
}

class SearchInput extends React.Component{
  placeholder = 'Pick-up Location';
  
  currentFocus = -1;

  selectedItemData;

  constructor(props){
    super(props);

    this.state = {
      inputValue: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleChange$ = new Subject();
    this.gc$ = new Subject();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.closeLists = this.closeLists.bind(this);
    this.addActive = this.addActive.bind(this);
    this.removeActive = this.removeActive.bind(this);
    this.createList = this.createList.bind(this);
    this.createListItem = this.createListItem.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.craeteSuggestions = this.craeteSuggestions.bind(this);

  }

  componentDidMount(){
    this.subscription = this.handleChange$.pipe(
      takeUntil(this.gc$),
      filter(({inputValue}) => inputValue.length > 1 ),
      debounceTime(300),
    ).subscribe(({inputValue, elementInput})=>{
      this.currentFocus = -1;
      this.craeteSuggestions(inputValue, elementInput);
    })
  }

  async craeteSuggestions(searchTerm, elementInput){
    const role = elementInput.dataset.role;
    const parentNode = elementInput.parentNode;
    const listItems = await this.getAutocompleteItems(searchTerm);
    parentNode.appendChild(this.createList(role, listItems));
  }

  componentWillUnmount(){
    if(this.gc$){
      this.gc$.next();
      this.gc$.complete();
    }
  }
  /**
   * Handles `input` event of the search element
   * Creates a list of suggestions
   * @param event 
   */
  handleChange(event){
    const inputValue = event.target.value
    this.closeLists();
    this.setState({inputValue});
    this.handleChange$.next({inputValue, elementInput: event.target});

  }
  /**
   * Creates a list for the passed items
   * @param idPrefix reqired in case of several inputs on a page
   * @param items list of items to be displayed
   * @returns 
   */
  createList(idPrefix = 'input', items = []){
    const list = document.createElement('ul');
    list.setAttribute('id', idPrefix+'__autocomplete-list');
    list.setAttribute("class", "autocomplete__items");
    list.setAttribute("role", "listbox");

    items.forEach(item=>{
      list.appendChild(this.createListItem(item));
    })
    return list;
  }
  /**
   * Creates `li` element for the current item
   * Addes the passed callback to its `click` event
   * @param item 
   * @param onClick 
   * @returns "<li>" element
   */
  createListItem(item){

    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'option');
    listItem.setAttribute('class', 'autocomplete__item');
    if(item.bookingId) {
      const type = this.getType(item.bookingId);
      const data = this.getData(item);
      listItem.innerHTML = `
        <div class="autocomplete__item-type autocomplete__item-type--${type}">
          ${type}
        </div>
        <div class="autocomplete__item-data">
          <div class="autocomplete__item-name">${item.name}</div>
          <div class="autocomplete__item-location">
            ${data}
          </div>
        </div>
      `;
      listItem.addEventListener('click', ()=>{this.selectItem(item)});
    } else {
      console.log('no results: ', item);
      listItem.innerHTML = `
        <span>${item.name}</span>
      `;
    }
    return listItem;
  }

  selectItem(item){
    const inputValue = this.getData(item);
    console.log('select item: ', inputValue);
    this.setState({inputValue});
    this.closeLists();
  }

  getType(bookingId){
    return bookingId.split('-')[0];
  }

  getData(item){
    let data = '';
    if(item.name || item.city) data += `${ item.name || item.city}, `;
    if(item.region) data += `${item.region}, `;
    if(item.country) data += `${item.country}`;
    return data;
  }
  /**
   * Closes all lists on the page
   */
  closeLists(){
    const autocompleteItems = document.getElementsByClassName('autocomplete__items');
    [].forEach.call(autocompleteItems, input=>{
      input.parentNode.removeChild(input)
    });
  }
  /**
   * Handles events keypress `DOWN`, `UP` and `ENTER`
   * updates the currentFocus for list items
   * @param {*} event 
   * @returns 
   */
  handleKeyDown(event){
    const role = event.target.dataset.role;
    const locator = `#${role}__autocomplete-list .autocomplete__item`;
    const elementsList = document.querySelectorAll(locator);
    if(!elementsList || !elementsList.length) return;
    if(event.keyCode == 40){
      // arrow DOWN
      this.currentFocus++;
      this.addActive(elementsList);
    } else if(event.keyCode == 38){
      // arrow UP
      this.currentFocus--;
      this.addActive(elementsList);
    } else if(event.keyCode === 13){
      // Enter
      event.preventDefault(); // to prevent sending forms
      if(this.currentFocus > -1 && elementsList){
        elementsList[this.currentFocus].click();
      }
    }
  }
  /**
   * Adds active class
   * @param elementsList 
   * @returns 
   */
  addActive(elementsList){
    if(!elementsList) return;
    this.removeActive(elementsList);
    if(this.currentFocus >= elementsList.length){
      this.currentFocus = 0;
    }
    if(this.currentFocus < 0) {
      this.currentFocus = elementsList.length -1;
    }
    elementsList[this.currentFocus].classList.add('autocomplete-item--active');
    elementsList[this.currentFocus].setAttribute('id', 'selected_option');
  }
  /**
   * Removes active class from all of the passed elements
   * @param elementsList 
   */
  removeActive(elementsList){
    elementsList.forEach(element=>{
      element.classList.remove('autocomplete-item--active');
      element.setAttribute('id', '');
    })
  }

  async getAutocompleteItems(searchTerm, resultsNumber=6){
    const url = new URL("https://www.rentalcars.com/FTSAutocomplete.do");
    url.searchParams.append('solrIndex', 'fts_en');
    url.searchParams.append('solrRows', resultsNumber);
    url.searchParams.append('solrTerm', searchTerm);
    const response = await fetch(url);
    const data = await response.json();
    return data.results.docs;
  }

  render(){
    return (
      <div className="pick-up-locationr">
        <input
          data-role="pick-up-location-input"
          className="pick-up-location__input"
          value={this.state.inputValue}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          // onBlur={this.closeLists}
          type="search" 
          placeholder={this.placeholder}
          aria-describedby="pick-up-location-input__autocomplete-list"
          aria-label={this.placeholder}
          aria-expanded="true"
          aria-autocomplete="list"
          aria-owns="pick-up-location-input__autocomplete-list"
          aria-activedescendant="selected_option"
        />
      </div>
    );
  }
}

class SearchForm extends React.Component {
  render(){
    return (
      <div className="search-form">
        <SearchInput />
      </div>
  )};
}

ReactDOM.render(
  <SearchForm />,
  document.getElementById('root')
);