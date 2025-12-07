import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecipes } from '../useRecipes';
import { recipeRepository } from '@/db/recipeRepository';

jest.mock('@/db/recipeRepository');
jest.mock('@/store/authStore');

describe('useRecipes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('fetches recipes', async () => {
    const mockRecipes = [
      {
        id: '1',
        title: 'Test Recipe',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ingredients: [],
        steps: [],
        tags: [],
        attachments: [],
      },
    ];

    (recipeRepository.getAllRecipes as jest.Mock).mockResolvedValue(mockRecipes);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useRecipes(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRecipes);
  });
});

