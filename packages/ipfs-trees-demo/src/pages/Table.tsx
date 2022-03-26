import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Table.css';

const mockData = [
    {
        key: '97060505',
        value: {
            name: 'Bob',
            score: 3,
        },
    },
    {
        key: '90695285',
        value: {
            name: 'Joe',
            score: 17000,
        },
    },
];

function Table() {
    const { cid } = useParams();

    const [json, setJson] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const data = await new Promise((res, rej) => setTimeout(() => res(mockData), 2000));
            setJson(data);
        })();
    }, []);

    return (
        <div>
            <strong>CID: {cid}</strong>
            <table>
                <tr>
                    <th scope='col'>Key</th>
                    <th scope='col'>Value</th>
                </tr>
                {json !== null &&
                    json.map((d: any) => (
                        <tr>
                            <td>{d['key']}</td>
                            <td>{JSON.stringify(d['value'])}</td>
                        </tr>
                    ))}
            </table>
        </div>
    );
}

export default Table;
