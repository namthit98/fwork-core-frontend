import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'

import App from './App'

afterEach(cleanup)

describe('<App />', () => {
  it('Render right', () => {
    render(<App />)
    expect(screen.getByText('FWork Frontend Core')).toBeDefined()
  })
})
