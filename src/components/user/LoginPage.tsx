import React from 'react';
import { LoginDto } from '../dto/LoginDto';
import { Button } from 'primereact/button';

export const LoginPage: React.FC = () =>{
    const example: LoginDto = {
        username: 'user',
        password: 'pass'
    }

    const dupa = (dto: LoginDto) => {
        alert(dto.username + dto.password)
    }

    return(
        <Button label="Submit" icon="pi pi-check" onClick={() => dupa(example)} />
    )
}