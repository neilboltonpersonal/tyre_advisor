import { createTheme, MantineColorsTuple } from '@mantine/core';

const softBlue: MantineColorsTuple = [
  '#eef3ff',
  '#dce4f5',
  '#b9c7e2',
  '#94a8d0',
  '#748cbc',
  '#5f78b0',
  '#516ca9',
  '#415b94',
  '#3b5185',
  '#334676'
];

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'softBlue',
  colors: {
    softBlue,
  },
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        variant: 'light',
      },
    },
  },
}); 