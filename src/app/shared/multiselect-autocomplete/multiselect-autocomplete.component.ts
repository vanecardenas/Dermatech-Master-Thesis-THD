import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-multiselect-autocomplete',
  templateUrl: './multiselect-autocomplete.component.html',
  styleUrls: ['./multiselect-autocomplete.component.scss'],
})
export class MultiselectAutocompleteComponent implements OnInit {
  @Output() result = new EventEmitter<MultiSelectOutput>();
  @Input() placeholder: string = 'Select Data';
  @Input() data: Item[] = [];
  @Input() key: string = '';
  @Input() label: string = 'Select Data';
  selectControl = new FormControl();
  rawData: ItemData[] = [];
  selectData: ItemData[] = [];
  filteredData: Observable<ItemData[]>;
  filterString: string = '';

  @ViewChild('autocompleteTrigger', {
    read: MatAutocompleteTrigger,
    static: false,
  })
  autocompleteTrigger: MatAutocompleteTrigger = {} as MatAutocompleteTrigger;

  constructor() {
    this.filteredData = this.selectControl.valueChanges.pipe(
      startWith<string>(''),
      map((value) => (typeof value === 'string' ? value : this.filterString)),
      map((filter) => this.filter(filter))
    );
  }

  ngOnInit(): void {
    this.data.forEach((item: Item) => {
      this.rawData.push({ item, selected: false });
    });
  }

  filter = (filter: string): Array<ItemData> => {
    this.filterString = filter;
    if (filter.length > 0) {
      return this.rawData.filter((option) => {
        return (
          option.item.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0
        );
      });
    } else {
      return this.rawData.slice();
    }
  };
  displayFn = (): string => '';

  optionClicked = (event: Event, data: ItemData): void => {
    event.stopPropagation();
    this.toggleSelection(data);
  };

  toggleSelection = (data: ItemData): void => {
    data.selected = !data.selected;
    if (data.selected === true) {
      this.selectData.push(data);
    } else {
      const i = this.selectData.findIndex(
        (value) => value.item.id === data.item.id
      );
      this.selectData.splice(i, 1);
    }
    this.selectControl.setValue(this.selectData);
    this.emitAdjustedData();
    this.autocompleteTrigger.updatePosition();
  };

  emitAdjustedData = (): void => {
    const results: Array<Item> = [];
    this.selectData.forEach((data: ItemData) => {
      results.push(data.item);
    });
    this.result.emit({ key: this.key, data: results });
  };

  removeChip = (data: ItemData): void => {
    this.autocompleteTrigger.updatePosition();
    this.toggleSelection(data);
  };
}
