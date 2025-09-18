import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import Navbar from './Navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: () => <Navbar />,
};
