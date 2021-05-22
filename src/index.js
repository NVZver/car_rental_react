import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class SearchInput extends React.Component{
  placeholder = 'Pick-up Location';
  
  currentFocus = -1;

  constructor(props){
    super(props);

    this.inputHandler = this.inputHandler.bind(this);
    this.keydownHandler = this.keydownHandler.bind(this);
    this.getAutocompleteItems = this.getAutocompleteItems.bind(this);
    this.closeLists = this.closeLists.bind(this);
    this.addActive = this.addActive.bind(this);
    this.removeActive = this.removeActive.bind(this);
  }

  inputHandler(event){
    const value = event.target.value
    this.closeLists();
    if(value && value.length > 1){
      const role = event.target.dataset.role;
      const parentNode = event.target.parentNode;
      this.currentFocus = -1;
      let elementAutocomlpleteList = document.createElement('div');
      elementAutocomlpleteList.setAttribute('id', role + '__autocomplete-list');
      elementAutocomlpleteList.setAttribute("class", "autocomplete__items");
      parentNode.appendChild(elementAutocomlpleteList);
      const listItems = this.getAutocompleteItems(value);
      
      listItems.forEach((item)=>{
        const elementAutocomlpleteListItem = document.createElement('div');
        elementAutocomlpleteListItem.setAttribute("class", "autocomplete__item");
        elementAutocomlpleteListItem.innerHTML = `<strong>${item.substr(0, value.length)}</strong>`;
        elementAutocomlpleteListItem.innerHTML += item.substr(value.length);
        elementAutocomlpleteListItem.innerHTML += `<input type="hidden" value="${item}" />`;
        elementAutocomlpleteListItem.addEventListener("click", (selectedItem)=>{
          event.target.value = selectedItem.target.getElementsByTagName('input')[0].value;
          this.closeLists();
        });
        elementAutocomlpleteList.appendChild(elementAutocomlpleteListItem);
      });
    }
  }

  closeLists(){
    const autocompleteItems = document.getElementsByClassName('autocomplete__items');
    [].forEach.call(autocompleteItems, input=>{
      input.parentNode.removeChild(input)
    });
  }

  keydownHandler(event){
    const role = event.target.dataset.role;
    const locator = `#${role}__autocomplete-list .autocomplete__item`;
    const elementsList = document.querySelectorAll(locator);
    
    if(event.keyCode == 40){
      // arrow DOWN
      this.currentFocus++;
      console.log(elementsList)
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
  }
  /**
   * Removes active class from all of the passed elements
   * @param elementsList 
   */
  removeActive(elementsList){
    elementsList.forEach(element=>{
      element.classList.remove('autocomplete-item--active');
    })
  }

  getAutocompleteItems(value){
    const autocompleteValues = ['qdrw', 'qdas', 'qdrw1'];
    return autocompleteValues.filter(item=>item.substr(0, value.length).toLowerCase() === value.toLowerCase());
  }

  render(){
    return (
      <div className="pick-up-locationr">
        <input
          data-role="pick-up-location-input"
          className="pick-up-location__input"
          onInput={this.inputHandler}
          onKeyDown={this.keydownHandler}
          // onBlur={this.closeLists}
          type="search" 
          placeholder={this.placeholder}
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