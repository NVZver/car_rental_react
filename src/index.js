import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

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

    this.inputHandler = this.inputHandler.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);
    this.getAutocompleteItems = this.getAutocompleteItems.bind(this);
    this.closeLists = this.closeLists.bind(this);
    this.addActive = this.addActive.bind(this);
    this.removeActive = this.removeActive.bind(this);
    this.createList = this.createList.bind(this);
    this.createListItem = this.createListItem.bind(this);
  }

  async inputHandler(event){
    const value = event.target.value
    this.closeLists();
    if(value && value.length > 1){
      const role = event.target.dataset.role;
      const parentNode = event.target.parentNode;
      this.currentFocus = -1;
      const listItems = await this.getAutocompleteItems(value);
      parentNode.appendChild(this.createList(role, listItems, event));
    }
  }

  createList(idPrefix, items = [], elementInput){
    const list = document.createElement('ul');
    list.setAttribute('id', idPrefix+'__autocomplete-list');
    list.setAttribute("class", "autocomplete__items");
    list.setAttribute("role", "listbox");

    items.forEach(item=>{
      const onItemClick = (selectedItem)=>{
        elementInput.target.value = selectedItem.target.getElementsByTagName('input')[0].value;
        this.selectedItemData = item;
        this.closeLists();
      };
      list.appendChild(this.createListItem(item, onItemClick));
    })
    return list;
  }

  createListItem(item, onClick){
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'option');
    listItem.setAttribute('class', 'autocomplete__item');
    listItem.innerHTML = `${item.name}`;
    listItem.innerHTML += `<input type="hidden" value="${item.name}" />`;
    listItem.addEventListener('click', onClick);
    return listItem;
  }

  closeLists(){
    const autocompleteItems = document.getElementsByClassName('autocomplete__items');
    console.log(autocompleteItems);
    [].forEach.call(autocompleteItems, input=>{
      input.parentNode.removeChild(input)
    });
  }

  keydownHandler(event){
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
      // event.preventDefault(); // required for forms
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
          onInput={this.inputHandler}
          onKeyDown={this.keydownHandler}
          onBlur={this.closeLists}
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