import { createSlice } from '@reduxjs/toolkit';
import { drugData, drugCategory } from '../resources/resource';

const initialState = {
  drugs: drugData || [],
  categories: drugCategory || {},
  selectedDrug: null,
};

export const drugSlice = createSlice({
  name: 'drugs',
  initialState,
  reducers: {
    setSelectedDrug: (state, action) => {
      state.selectedDrug = action.payload;
    },
  },
});

export const { setSelectedDrug } = drugSlice.actions;

// Selectors
export const selectAllDrugs = (state) => state.drugs.drugs;
export const selectDrugCategories = (state) => state.drugs.categories;
export const selectSelectedDrug = (state) => state.drugs.selectedDrug;
export const selectDrugById = (state, drugId) => 
  state.drugs.drugs.find(drug => drug.id === drugId);

export default drugSlice.reducer;