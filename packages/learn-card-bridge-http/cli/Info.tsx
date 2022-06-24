import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import SyntaxHighlight from 'ink-syntax-highlight';
import { lookpath } from 'lookpath';

type InfoProps = {
    path: string;
};

const Info: React.FC<InfoProps> = ({ path }) => {
    const [pnpm, setPnpm] = useState(true);
    const [aws, setAws] = useState(true);

    useEffect(() => {
        const checkForBinaries = async () => {
            setPnpm(!!(await lookpath('pnpm')));
            setAws(!!(await lookpath('aws')));
        };

        checkForBinaries();
    }, []);

    return (
        <Box
            flexGrow={1}
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            padding={2}
            borderStyle="round"
            borderColor="yellow"
        >
            <Text>Success!</Text>
            <Text>Your new Learn Card HTTP Bridge is ready to deploy!</Text>
            {aws ? (
                <Text>To deploy, run the following commands:</Text>
            ) : (
                <>
                    <Text>It looks like you might not have serverless/AWS set up yet!</Text>
                    <Text>
                        Please review the instructions at
                        https://www.serverless.com/framework/docs/tutorial if you have any issues
                        deploying the Learn Card HTTP Bridge!
                    </Text>
                    <Text>
                        After you're all set up, run the following commands to deploy the Learn Card
                        HTTP Bridge!
                    </Text>
                </>
            )}

            <Box borderStyle="round" flexDirection="column">
                {!pnpm && (
                    <Text>
                        <Text color="green">{'$ '}</Text>
                        <SyntaxHighlight code="npm i -g pnpm # must use pnpm!" language="bash" />
                    </Text>
                )}
                <Text>
                    <Text color="green">{'$ '}</Text>
                    <SyntaxHighlight
                        code={`cd ${path}/packages/learn-card-bridge-http`}
                        language="bash"
                    />
                </Text>
                <Text>
                    <Text color="green">{'$ '}</Text>
                    <SyntaxHighlight code="pnpm i" language="bash" />
                </Text>
                <Text>
                    <Text color="green">{'$ '}</Text>
                    <SyntaxHighlight code="pnpm exec serverless deploy" language="bash" />
                </Text>
            </Box>
        </Box>
    );
};

export default Info;
