import React, { useState, useCallback } from 'react';

export interface TutorialStep {
    title: string;
    content: React.ReactNode;
    command?: string;
    commandLabel?: string;
    followUpCommand?: string;
    followUpLabel?: string;
    hint?: string;
    expectedOutput?: string;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: string;
    duration: string;
    steps: TutorialStep[];
}

const TUTORIALS: Tutorial[] = [
    {
        id: 'intro',
        title: 'Getting Started',
        description: 'Learn the basics of the CLI and your LearnCard wallet',
        icon: '🚀',
        duration: '3 min',
        steps: [
            {
                title: 'Welcome!',
                content: (
                    <>
                        <p>
                            This tutorial will introduce you to the LearnCard CLI and help you understand
                            the basics of working with your wallet.
                        </p>
                        <p>
                            <strong>What you'll learn:</strong>
                        </p>
                        <ul>
                            <li>What LearnCard is and what it can do</li>
                            <li>How to access your wallet's identity</li>
                            <li>How to use the CLI effectively</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'What is LearnCard?',
                content: (
                    <>
                        <p>
                            <strong>LearnCard</strong> is a digital wallet for verifiable credentials.
                            Think of it like a wallet for digital certificates, badges, and records that
                            can be cryptographically verified.
                        </p>
                        <p>Key concepts:</p>
                        <ul>
                            <li><strong>DID</strong> — Your decentralized identifier (like a username)</li>
                            <li><strong>Credentials</strong> — Digital certificates you can issue or receive</li>
                            <li><strong>Boosts</strong> — Reusable credential templates on the network</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Your Identity (DID)',
                content: (
                    <>
                        <p>
                            Every LearnCard wallet has a unique identity called a <strong>DID</strong>
                            (Decentralized Identifier). Let's see yours!
                        </p>
                        <p>Try running this command:</p>
                    </>
                ),
                command: 'learnCard.id.did()',
                hint: 'Click "Run Command" or copy and paste into the terminal',
            },
            {
                title: 'The learnCard Object',
                content: (
                    <>
                        <p>
                            The <code>learnCard</code> object is your wallet. It has several namespaces:
                        </p>
                        <ul>
                            <li><code>learnCard.id</code> — Identity operations</li>
                            <li><code>learnCard.invoke</code> — Main API methods</li>
                            <li><code>learnCard.read</code> — Read-only operations</li>
                        </ul>
                        <p>Try exploring what's available:</p>
                    </>
                ),
                command: 'Object.keys(learnCard.invoke)',
                hint: 'This shows all available methods on invoke',
            },
            {
                title: 'Using the Command Builder',
                content: (
                    <>
                        <p>
                            The <strong>Command Builder</strong> (📚 on the left) helps you discover
                            and construct API calls without memorizing syntax.
                        </p>
                        <p>Tips:</p>
                        <ul>
                            <li>Browse by category or search for commands</li>
                            <li>Click a command to expand and fill in parameters</li>
                            <li>Use "Insert Command" to add it to the terminal</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'The _ Variable',
                content: (
                    <>
                        <p>
                            The special <code>_</code> variable always contains the result of your
                            last command. This is useful for chaining operations!
                        </p>
                        <p>Try this sequence:</p>
                    </>
                ),
                command: 'learnCard.id.did()',
                commandLabel: '1. Get your DID',
                followUpCommand: 'copy(_)',
                followUpLabel: '2. Copy it to clipboard',
                hint: 'The _ variable now contains your DID!',
            },
            {
                title: 'Congrats!',
                content: (
                    <>
                        <p>
                            🎉 You've completed the Getting Started tutorial!
                        </p>
                        <p>You now know:</p>
                        <ul>
                            <li>What LearnCard is</li>
                            <li>How to find your DID</li>
                            <li>How to use the Command Builder</li>
                            <li>How to use the <code>_</code> variable</li>
                        </ul>
                        <p>
                            Try the other tutorials to learn about issuing credentials and more!
                        </p>
                    </>
                ),
            },
        ],
    },
    {
        id: 'credentials',
        title: 'Issuing Credentials',
        description: 'Create and issue your first verifiable credential',
        icon: '📜',
        duration: '5 min',
        steps: [
            {
                title: 'What is a Credential?',
                content: (
                    <>
                        <p>
                            A <strong>Verifiable Credential (VC)</strong> is a digital certificate
                            that can be cryptographically verified. Examples:
                        </p>
                        <ul>
                            <li>Course completion certificates</li>
                            <li>Professional badges</li>
                            <li>Employment records</li>
                            <li>Skills attestations</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Creating an Unsigned Credential',
                content: (
                    <>
                        <p>
                            First, we create an <strong>unsigned credential</strong> using a template.
                            The <code>newCredential</code> method helps with this:
                        </p>
                    </>
                ),
                command: `learnCard.invoke.newCredential({
  type: 'achievement',
  subject: 'did:example:recipient',
  name: 'CLI Tutorial Badge',
  description: 'Completed the CLI tutorial'
})`,
                hint: 'This creates an unsigned VC template',
            },
            {
                title: 'Examining the Credential',
                content: (
                    <>
                        <p>
                            The previous command returned an unsigned credential object stored in <code>_</code>.
                            Notice it has:
                        </p>
                        <ul>
                            <li><code>@context</code> — JSON-LD context for meaning</li>
                            <li><code>type</code> — The credential types</li>
                            <li><code>issuer</code> — Your DID (the issuer)</li>
                            <li><code>credentialSubject</code> — Who/what it's about</li>
                        </ul>
                        <p>But it doesn't have a <code>proof</code> yet — let's sign it!</p>
                    </>
                ),
            },
            {
                title: 'Signing the Credential',
                content: (
                    <>
                        <p>
                            To make a credential verifiable, we need to <strong>sign it</strong>
                            with our wallet's private key:
                        </p>
                    </>
                ),
                command: 'await learnCard.invoke.issueCredential(_)',
                hint: 'This signs the unsigned credential stored in _',
            },
            {
                title: 'Verifying the Credential',
                content: (
                    <>
                        <p>
                            Now <code>_</code> contains a signed credential with a <code>proof</code>.
                            Let's verify it:
                        </p>
                    </>
                ),
                command: 'await learnCard.invoke.verifyCredential(_)',
                hint: 'This checks the cryptographic signature',
            },
            {
                title: 'Understanding Verification',
                content: (
                    <>
                        <p>
                            The verification result tells you:
                        </p>
                        <ul>
                            <li><code>warnings</code> — Non-critical issues</li>
                            <li><code>errors</code> — Critical problems (invalid signature, etc.)</li>
                            <li><code>checks</code> — What was verified</li>
                        </ul>
                        <p>An empty errors array means the credential is valid! 🎉</p>
                    </>
                ),
            },
            {
                title: 'Congrats!',
                content: (
                    <>
                        <p>
                            🎉 You've issued and verified your first credential!
                        </p>
                        <p>You learned:</p>
                        <ul>
                            <li>How to create unsigned credentials</li>
                            <li>How to sign (issue) credentials</li>
                            <li>How to verify credentials</li>
                        </ul>
                        <p>
                            Next, try the Boosts tutorial to learn about credential templates on the network!
                        </p>
                    </>
                ),
            },
        ],
    },
    {
        id: 'boosts',
        title: 'Working with Boosts',
        description: 'Create reusable credential templates on the network',
        icon: '🚀',
        duration: '5 min',
        steps: [
            {
                title: 'What are Boosts?',
                content: (
                    <>
                        <p>
                            <strong>Boosts</strong> are credential templates stored on the LearnCard Network.
                            They allow you to:
                        </p>
                        <ul>
                            <li>Create reusable credential designs</li>
                            <li>Send credentials to other users</li>
                            <li>Track who has received a credential</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Your Profile',
                content: (
                    <>
                        <p>
                            To work with Boosts, you need a profile on the LearnCard Network.
                            Let's check your profile:
                        </p>
                    </>
                ),
                command: 'await learnCard.invoke.getProfile()',
                hint: 'This fetches your network profile',
            },
            {
                title: 'Getting Your Boosts',
                content: (
                    <>
                        <p>
                            If you have any boosts, you can retrieve them with pagination:
                        </p>
                    </>
                ),
                command: 'await learnCard.invoke.getPaginatedBoosts()',
                hint: 'Returns paginated list of your boosts',
            },
            {
                title: 'Creating a Boost',
                content: (
                    <>
                        <p>
                            To create a new boost, you first create an unsigned credential,
                            then use <code>createBoost</code> to publish it to the network.
                        </p>
                        <p>
                            This is typically done through the app UI, but you can also do it via the CLI
                            for advanced use cases.
                        </p>
                    </>
                ),
            },
            {
                title: 'Using Chain Builder',
                content: (
                    <>
                        <p>
                            For complex workflows like "create credential → create boost → send to user",
                            use the <strong>Chain Builder</strong> (⛓️ on the right)!
                        </p>
                        <ul>
                            <li>Build sequences of commands</li>
                            <li>Each step's result passes to the next via <code>_</code></li>
                            <li>Save and reuse chains</li>
                            <li>Export to share with others</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Congrats!',
                content: (
                    <>
                        <p>
                            🎉 You've completed all the tutorials!
                        </p>
                        <p>You now understand:</p>
                        <ul>
                            <li>LearnCard basics and your wallet</li>
                            <li>Creating and verifying credentials</li>
                            <li>Working with Boosts on the network</li>
                            <li>Using the Chain Builder for automation</li>
                        </ul>
                        <p>
                            Explore the Command Builder to discover more API methods, and don't hesitate
                            to build your own chains for repetitive tasks!
                        </p>
                    </>
                ),
            },
        ],
    },
    {
        id: 'chains',
        title: 'Building Chains',
        description: 'Learn to automate workflows with the Chain Builder',
        icon: '⛓️',
        duration: '4 min',
        steps: [
            {
                title: 'What are Chains?',
                content: (
                    <>
                        <p>
                            <strong>Chains</strong> let you combine multiple commands into a reusable workflow.
                            Think of them like macros or scripts that automate repetitive tasks.
                        </p>
                        <p><strong>Use cases:</strong></p>
                        <ul>
                            <li>Issue a credential and immediately verify it</li>
                            <li>Create a boost and send it to multiple users</li>
                            <li>Fetch data, transform it, and store the result</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Opening Chain Builder',
                content: (
                    <>
                        <p>
                            Look for the <strong>⛓️ Chain Builder</strong> tab on the right side of the terminal.
                            Click it to open the chain builder panel.
                        </p>
                        <p>
                            If you don't see it, look for the toggle button on the right edge of the screen.
                        </p>
                        <p><strong>Tip:</strong> You can have both the Command Sidebar (left) and Chain Builder (right) open at the same time!</p>
                    </>
                ),
            },
            {
                title: 'Adding Steps',
                content: (
                    <>
                        <p>
                            There are two ways to add steps to a chain:
                        </p>
                        <ul>
                            <li><strong>From Command Sidebar:</strong> Click "Add to Chain" on any command</li>
                            <li><strong>Custom Command:</strong> Type any JavaScript in the Chain Builder</li>
                        </ul>
                        <p>
                            Let's try it! Open the Command Sidebar, find <strong>"Get DID"</strong> under Identity,
                            and click "Add to Chain".
                        </p>
                    </>
                ),
            },
            {
                title: 'The _ Variable',
                content: (
                    <>
                        <p>
                            The magic of chains is the <code>_</code> variable. It holds the result of
                            the previous step, letting you pass data through your workflow.
                        </p>
                        <p><strong>Example chain:</strong></p>
                        <ol>
                            <li><code>learnCard.invoke.getTestVc()</code> → creates a VC</li>
                            <li><code>await learnCard.invoke.issueCredential(_)</code> → signs it (using _ from step 1)</li>
                            <li><code>await learnCard.invoke.verifyCredential(_)</code> → verifies it (using _ from step 2)</li>
                        </ol>
                    </>
                ),
            },
            {
                title: 'Reordering Steps',
                content: (
                    <>
                        <p>
                            Made a mistake? No problem! You can:
                        </p>
                        <ul>
                            <li><strong>Drag</strong> steps to reorder them (grab the step card)</li>
                            <li><strong>Delete</strong> steps with the × button</li>
                            <li><strong>Clear all</strong> to start fresh</li>
                        </ul>
                        <p>
                            The step numbers update automatically when you reorder.
                        </p>
                    </>
                ),
            },
            {
                title: 'Running a Chain',
                content: (
                    <>
                        <p>
                            Once your chain is ready, click <strong>"▶ Run Chain"</strong> to execute it.
                        </p>
                        <p>
                            The chain runner will:
                        </p>
                        <ul>
                            <li>Execute each step in order</li>
                            <li>Show the output of each step</li>
                            <li>Stop if any step fails</li>
                            <li>Pass each result to the next step via <code>_</code></li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Saving Chains',
                content: (
                    <>
                        <p>
                            Don't lose your work! Click <strong>"💾 Save"</strong> to save your chain.
                        </p>
                        <ul>
                            <li>Give your chain a descriptive name</li>
                            <li>Saved chains appear in the "Saved Chains" section</li>
                            <li>Click a saved chain to load it</li>
                            <li>Chains are stored in your browser's localStorage</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Exporting Chains',
                content: (
                    <>
                        <p>
                            Want to share a chain with a colleague? Click <strong>"📋 Export"</strong>
                            to copy the chain as JSON.
                        </p>
                        <p>
                            You can then:
                        </p>
                        <ul>
                            <li>Paste it into a document or message</li>
                            <li>Save it to a file for version control</li>
                            <li>Import it later by pasting into a custom step</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Example: Issue & Verify',
                content: (
                    <>
                        <p>
                            Let's build a practical chain! Add these commands in order:
                        </p>
                        <ol>
                            <li><strong>Step 1:</strong> <code>learnCard.invoke.getTestVc()</code></li>
                            <li><strong>Step 2:</strong> <code>await learnCard.invoke.issueCredential(_)</code></li>
                            <li><strong>Step 3:</strong> <code>await learnCard.invoke.verifyCredential(_)</code></li>
                        </ol>
                        <p>
                            Run it to create, sign, and verify a test credential in one go!
                        </p>
                    </>
                ),
                command: 'learnCard.invoke.getTestVc()',
                commandLabel: 'Add Step 1',
                hint: 'Add this as the first step of your chain, then add the other steps manually',
            },
            {
                title: 'You\'re a Chain Master!',
                content: (
                    <>
                        <p>
                            🎉 <strong>Congratulations!</strong> You now know how to:
                        </p>
                        <ul>
                            <li>Create multi-step command chains</li>
                            <li>Use <code>_</code> to pass data between steps</li>
                            <li>Reorder, save, and export chains</li>
                            <li>Automate complex LearnCard workflows</li>
                        </ul>
                        <p>
                            Start building your own chains to speed up your development workflow!
                        </p>
                    </>
                ),
            },
        ],
    },
];

interface TutorialProps {
    isOpen: boolean;
    onClose: () => void;
    onRunCommand: (command: string) => void;
}

const TutorialComponent: React.FC<TutorialProps> = ({ isOpen, onClose, onRunCommand }) => {
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);

    const handleSelectTutorial = useCallback((tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setCurrentStep(0);
    }, []);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            setSelectedTutorial(null);
        }
    }, [currentStep]);

    const handleNext = useCallback(() => {
        if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setSelectedTutorial(null);
            onClose();
        }
    }, [selectedTutorial, currentStep, onClose]);

    const handleRunCommand = useCallback((command: string) => {
        onRunCommand(command);
        setIsMinimized(true);
    }, [onRunCommand]);

    const handleRestore = useCallback(() => {
        setIsMinimized(false);
    }, []);

    if (!isOpen) return null;

    if (isMinimized && selectedTutorial) {
        const step = selectedTutorial.steps[currentStep];

        return (
            <div className="tutorial-minimized">
                <div className="tutorial-minimized-content">
                    <span className="tutorial-minimized-icon">{selectedTutorial.icon}</span>

                    <div className="tutorial-minimized-info">
                        <span className="tutorial-minimized-title">{step?.title}</span>

                        <span className="tutorial-minimized-progress">
                            Step {currentStep + 1}/{selectedTutorial.steps.length}
                        </span>
                    </div>
                </div>

                <div className="tutorial-minimized-actions">
                    <button onClick={handleRestore} className="tutorial-minimized-continue">
                        Continue Tutorial
                    </button>

                    <button onClick={onClose} className="tutorial-minimized-close" title="Close">
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    const step = selectedTutorial?.steps[currentStep];

    return (
        <div className="tutorial-overlay">
            <div className="tutorial-modal">
                {!selectedTutorial ? (
                    <>
                        <div className="tutorial-header">
                            <h2>📖 Tutorials</h2>

                            <button onClick={onClose} className="tutorial-close">✕</button>
                        </div>

                        <p className="tutorial-intro">
                            Learn LearnCard concepts and CLI usage through interactive tutorials.
                        </p>

                        <div className="tutorial-list">
                            {TUTORIALS.map(tutorial => (
                                <button
                                    key={tutorial.id}
                                    onClick={() => handleSelectTutorial(tutorial)}
                                    className="tutorial-card"
                                >
                                    <span className="tutorial-card-icon">{tutorial.icon}</span>

                                    <div className="tutorial-card-content">
                                        <h4>{tutorial.title}</h4>

                                        <p>{tutorial.description}</p>

                                        <span className="tutorial-card-duration">{tutorial.duration}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="tutorial-header">
                            <div className="tutorial-progress">
                                <span className="tutorial-progress-icon">{selectedTutorial.icon}</span>

                                <span className="tutorial-progress-title">{selectedTutorial.title}</span>

                                <span className="tutorial-progress-step">
                                    {currentStep + 1} / {selectedTutorial.steps.length}
                                </span>
                            </div>

                            <button onClick={onClose} className="tutorial-close">✕</button>
                        </div>

                        <div className="tutorial-progress-bar">
                            <div
                                className="tutorial-progress-fill"
                                style={{ width: `${((currentStep + 1) / selectedTutorial.steps.length) * 100}%` }}
                            />
                        </div>

                        <div className="tutorial-step">
                            <h3>{step?.title}</h3>

                            <div className="tutorial-step-content">
                                {step?.content}
                            </div>

                            {step?.command && (
                                <div className="tutorial-command">
                                    <div className="tutorial-command-header">
                                        <span>{step.commandLabel || 'Try this command:'}</span>

                                        <button
                                            onClick={() => handleRunCommand(step.command!)}
                                            className="tutorial-run-btn"
                                        >
                                            ▶ Run
                                        </button>
                                    </div>

                                    <pre>{step.command}</pre>

                                    {step.followUpCommand && (
                                        <>
                                            <div className="tutorial-command-header tutorial-followup-header">
                                                <span>{step.followUpLabel || 'Then run:'}</span>

                                                <button
                                                    onClick={() => handleRunCommand(step.followUpCommand!)}
                                                    className="tutorial-run-btn tutorial-run-btn-followup"
                                                >
                                                    ▶ Run
                                                </button>
                                            </div>

                                            <pre>{step.followUpCommand}</pre>
                                        </>
                                    )}

                                    {step.hint && (
                                        <p className="tutorial-hint">💡 {step.hint}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="tutorial-nav">
                            <button onClick={handleBack} className="tutorial-nav-back">
                                {currentStep === 0 ? '← Back to List' : '← Previous'}
                            </button>

                            <button onClick={handleNext} className="tutorial-nav-next">
                                {currentStep === selectedTutorial.steps.length - 1 ? 'Finish ✓' : 'Next →'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TutorialComponent;
export { TUTORIALS };
