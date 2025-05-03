import styled from 'styled-components'

export const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 2rem;
`

export const Title = styled.h1`
	font-size: 2rem;
	font-weight: bold;
	color: ${({ theme }) => theme.colors.text.primary};
`

export const SearchInput = styled.input`
	width: 100%;
	max-width: 400px;
	padding: 0.75rem 1rem;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	font-size: 1rem;
	margin-bottom: 2rem;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`

export const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
`

export const Card = styled.div`
	background: ${({ theme }) => theme.colors.background.card || theme.colors.background.primary};
	border-radius: 0.5rem;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
`

export const CardHeader = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const CardTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text.primary};
`

export const CardContent = styled.div`
	padding: 1.5rem;
`

export const Button = styled.button<{ variant?: 'primary' | 'ghost' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;

	${({ variant, theme }) => {
		switch (variant) {
			case 'ghost':
				return `
          background: transparent;
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.text.primary};

          &:hover {
            background: ${theme.colors.background.hover};
          }
        `
			default:
				return `
          background: ${theme.colors.primary};
          border: none;
          color: white;

          &:hover {
            background: ${theme.colors.primary};
          }
        `
		}
	}}
`

export const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
`

export const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`

export const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: ${({ theme }) => theme.colors.text.secondary};
`

export const Input = styled.input`
	padding: 0.75rem 1rem;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	font-size: 1rem;

	&:focus {
		outline: none;
		border-color: ${({ theme }) => theme.colors.primary};
	}
`

export const ErrorMessage = styled.div`
	color: ${({ theme }) => theme.colors.danger};
	font-size: 0.875rem;
	margin-top: 0.5rem;
`

export const VideoContainer = styled.div`
	position: relative;
	width: 100%;
	padding-top: 56.25%; /* 16:9 Aspect Ratio */
	margin: 2rem 0;
`

export const VideoFrame = styled.iframe`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: none;
	border-radius: 0.5rem;
`
