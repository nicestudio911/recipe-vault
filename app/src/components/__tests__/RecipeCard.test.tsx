import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecipeCard } from '../RecipeCard';
import { Recipe } from '@/types';

const mockRecipe: Recipe = {
  id: '1',
  user_id: 'user1',
  title: 'Test Recipe',
  description: 'A test recipe',
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ingredients: [],
  steps: [],
  tags: [],
  attachments: [],
};

describe('RecipeCard', () => {
  it('renders recipe title', () => {
    const { getByText } = render(
      <RecipeCard recipe={mockRecipe} onPress={() => {}} />
    );
    expect(getByText('Test Recipe')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <RecipeCard recipe={mockRecipe} onPress={onPress} />
    );
    fireEvent.press(getByText('Test Recipe'));
    expect(onPress).toHaveBeenCalled();
  });

  it('displays prep and cook time', () => {
    const { getByText } = render(
      <RecipeCard recipe={mockRecipe} onPress={() => {}} />
    );
    expect(getByText('Prep: 15m')).toBeTruthy();
    expect(getByText('Cook: 30m')).toBeTruthy();
  });
});

