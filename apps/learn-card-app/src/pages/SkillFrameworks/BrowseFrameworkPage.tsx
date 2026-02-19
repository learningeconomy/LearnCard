import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cloneDeep } from 'lodash-es';
import {
    useModal,
    ModalTypes,
    useGetSkillFrameworkById,
    useWallet,
    useToast,
    ToastTypeEnum,
    useSearchFrameworkSkills,
} from 'learn-card-base';

import { IonPage, IonSpinner } from '@ionic/react';
import ManageSkills from './ManageSkills';
import FrameworkColumn from './FrameworkColumn';
import ViewAlignmentInfo from './ViewAlignmentInfo';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import FrameworkSearchResults from './FrameworkSearchResults';
import FrameworkUpdatedSucessModal from './FrameworkUpdatedSucessModal';
import ManageSkillsCancelUpdateModal from './ManageSkillsCancelUpdateModal';
import ManageSkillsConfirmationModal from './ManageSkillsConfirmationModal';
import BrowseFrameworkMultiColumnHeader from './BrowseFrameworkMultiColumnHeader';

import {
    ApiFrameworkInfo,
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
    convertApiSkillNodesToSkillFrameworkNodes,
    convertSkillToBackendFormat,
    countCompetenciesInNode,
    generateSkillId,
} from '../../helpers/skillFramework.helpers';
import {
    FrameworkNodeRole,
    SkillFrameworkNode,
    SkillFrameworkNodeWithSearchInfo,
} from '../../components/boost/boost';
import { SetState } from 'packages/shared-types/dist';

type BrowseFrameworkPageProps = {
    frameworkInfo: ApiFrameworkInfo;
    isApproveFlow?: boolean;
    fullSkillTree?: SkillFrameworkNode[];
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    setSelectedSkills?: SetState<SkillFrameworkNode[]>;
    handleClose: () => void;
    handleApproveOverride?: (skillTree: SkillFrameworkNode[]) => void;
    isViewOnly?: boolean;
};

const BrowseFrameworkPage: React.FC<BrowseFrameworkPageProps> = ({
    frameworkInfo,
    handleClose: _handleClose,
    isApproveFlow = false,
    fullSkillTree,
    isSelectSkillsFlow = false,
    selectedSkills: initialSkills,
    setSelectedSkills: _setSelectedSkills,
    handleApproveOverride,
    isViewOnly = false,
}) => {
    const { presentToast } = useToast();
    const { initWallet } = useWallet();
    const { newModal, closeModal, closeAllModals } = useModal();
    const queryClient = useQueryClient();

    const [selectedSkills, setSelectedSkills] = useState<SkillFrameworkNode[]>(initialSkills || []);
    const [search, setSearch] = useState('');
    const [isFullScreenSearch, setIsFullScreenSearch] = useState(false);
    const [selectedPath, setSelectedPath] = useState<SkillFrameworkNode[]>([]);
    const [isEdit, setIsEdit] = useState(isApproveFlow);
    const [pageWidth, setPageWidth] = useState<number>(0);
    const pageRef = useRef<any>(null);

    const [addedNodes, setAddedNodes] = useState<
        Record<string, (SkillFrameworkNode & { path: SkillFrameworkNode[] })[]>
    >({}); // parent node id -> created node[]
    const [editedNodes, setEditedNodes] = useState<Record<string, SkillFrameworkNode>>({}); // edited node id -> edited node
    const [deletedNodes, setDeletedNodes] = useState<SkillFrameworkNode[]>([]);

    // Track adjustments to skill counts for each node
    // Positive numbers mean skills were added, negative means skills were removed
    const [countAdjustments, setCountAdjustments] = useState<Record<string, number>>({});

    const isFullSkillFramework = fullSkillTree !== undefined;
    const disableSave = initialSkills?.length === 0 && selectedSkills?.length === 0;

    // set max columns based on page width
    const maxColumns = pageWidth < 534 ? 1 : Math.ceil(pageWidth / 400); // round up

    const { data, isLoading } = useGetSkillFrameworkById(
        !isFullSkillFramework ? frameworkInfo.id : ''
    );

    // TODO handle pagination
    const { data: searchResultsApiData, isLoading: searchLoading } = useSearchFrameworkSkills(
        frameworkInfo.id,
        {
            $or: [
                { code: { $regex: `/${search}/i` } }, // Case-insensitive regex match on code
                { statement: { $regex: `/${search}/i` } }, // Case-insensitive regex match on statement
            ],
        },
        { enabled: !isFullSkillFramework }
    );

    // Recursively search through all levels of the skill tree
    const searchNodes = (
        nodes: SkillFrameworkNode[] = [],
        currentPath: SkillFrameworkNode[] = []
    ): SkillFrameworkNodeWithSearchInfo[] => {
        const results: SkillFrameworkNodeWithSearchInfo[] = [];

        nodes.forEach(node => {
            const nodePath = [...currentPath, node];
            const numberOfSkills = countCompetenciesInNode(node);

            // Check if current node matches the search query
            if (
                node.targetName?.toLowerCase().includes(search.toLowerCase()) ||
                node.targetCode?.toLowerCase().includes(search.toLowerCase())
            ) {
                results.push({
                    ...node,
                    path: [...nodePath],
                    numberOfSkills,
                });
            }

            // Recursively search through subskills if they exist
            if (node.subskills && node.subskills.length > 0) {
                results.push(...searchNodes(node.subskills, nodePath));
            }
        });

        return results;
    };

    const fullSkillTreeSearchResults: SkillFrameworkNodeWithSearchInfo[] =
        search && search.length > 0 ? searchNodes(fullSkillTree) : [];

    const initialSearchResults = isFullSkillFramework
        ? fullSkillTreeSearchResults
        : searchResultsApiData?.records?.map((record: ApiSkillNode) =>
              convertApiSkillNodeToSkillTreeNode(record)
          ) || [];

    // Process edited nodes - get all nodes that have been edited
    const editedNodesList = Object.entries(editedNodes).map(([id, editedNode]) => ({
        ...editedNode,
        id, // Ensure ID is preserved
    }));

    // Process added nodes - flatten the addedNodes object
    const addedNodesList = Object.values(addedNodes).flat();

    // Combine all potential nodes that might match the search
    const allPotentialNodes = [...initialSearchResults, ...addedNodesList, ...editedNodesList];

    // Process all nodes: apply edits and filter
    const processedSearchResults = allPotentialNodes
        .map((node: SkillFrameworkNode) => {
            // Apply any edits to the node
            if (node.id && editedNodes[node.id]) {
                return { ...node, ...editedNodes[node.id] };
            }
            return node;
        })
        .filter((node, index, self) => {
            // Remove duplicates by keeping the last occurrence of each node (which will have the most recent edits)
            const nodeIndex = self.findIndex(n => n.id === node.id);
            if (nodeIndex !== index) return false;

            // Skip deleted nodes
            if (deletedNodes.some(deletedNode => deletedNode.id === node.id)) {
                return false;
            }

            // If there's no active search, keep the node (if not deleted)
            if (!search) return true;

            // Check if the node (with edits) matches the search query
            const lowerSearch = search.toLowerCase();
            return (
                node.targetName?.toLowerCase().includes(lowerSearch) ||
                node.targetCode?.toLowerCase().includes(lowerSearch)
            );
        });

    // The processed results now include all matching nodes, including those that were edited to match the search
    const searchResults = processedSearchResults;

    useEffect(() => {
        if (search === '') {
            setIsFullScreenSearch(false);
        }
    }, [search]);

    const frameworkSkills = data?.skills; // paginated
    const apiSkills = frameworkSkills?.records;

    const openManageJsonModal = () => {
        newModal(
            <ManageSkills
                initialFrameworkId={frameworkInfo.id}
                isManageJsonVersion
                handleBrowseFramework={() => {
                    // we're already on the browse page, so we just need to reset the state
                    setIsEdit(false);
                    setSelectedPath([]);
                    setSearch('');
                }}
                onSuccessClose={_handleClose}
            />,
            {
                sectionClassName: '!bg-transparent !shadow-none',
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
        );
    };

    const handleBack = () => {
        setSelectedPath(selectedPath.slice(0, -1));
    };

    useEffect(() => {
        if (!isEdit && !isApproveFlow) {
            // reset count adjustments when not in edit mode
            //   fixes some occasional bugginess when browsing after editing
            setCountAdjustments({});
        }
    }, [isApproveFlow, isEdit]);

    // Update count adjustments for all parent nodes in the hierarchy
    const updateParentCounts = (delta: number, parentPath: string[] = []) => {
        setCountAdjustments(prev => {
            const newAdjustments = { ...prev };

            // Always update the root count
            newAdjustments['root'] = (newAdjustments['root'] || 0) + delta;

            // Update all parent nodes in the path
            parentPath.forEach(parentId => {
                newAdjustments[parentId] = (newAdjustments[parentId] || 0) + delta;
            });

            return newAdjustments;
        });
    };

    const numAdds = Object.values(addedNodes).flat().length;
    const numEdits = Object.keys(editedNodes).length;
    const numDeletes = deletedNodes.length;
    let changesExist = numAdds > 0 || numEdits > 0 || numDeletes > 0;
    if (isSelectSkillsFlow) {
        // Create a function to get a unique string representation of a node
        const getNodeKey = (node: SkillFrameworkNode) =>
            JSON.stringify({
                id: node.id,
                name: node.targetName,
            });

        // Convert arrays to sets of stringified nodes for comparison
        const selectedSet = new Set(selectedSkills.map(getNodeKey));
        const initialSet = new Set((initialSkills || []).map(getNodeKey));

        // Check if the sets have the same size and all items in selectedSet exist in initialSet
        changesExist =
            selectedSet.size !== initialSet.size ||
            !Array.from(selectedSet).every(key => initialSet.has(key));
    }

    const handleResetEdits = () => {
        setAddedNodes({});
        setEditedNodes({});
        setDeletedNodes([]);
    };

    const handleCreateNode = (
        parentNodeId: string = 'root',
        node: SkillFrameworkNode,
        parentPath: SkillFrameworkNode[] = []
    ) => {
        node.id = node.id || generateSkillId();
        setAddedNodes(prev => ({
            ...prev,
            [parentNodeId]: [
                ...(prev[parentNodeId] || []),
                { ...node, path: [...parentPath, node] },
            ],
        }));

        // If the new node is a competency, update parent counts
        if (node.role === FrameworkNodeRole.competency) {
            updateParentCounts(
                1,
                parentPath.map(node => node.id)
            );
        }
    };

    const handleEditNode = (node: SkillFrameworkNode, path: SkillFrameworkNode[] = []) => {
        // Check if the node is in the selected path
        const nodeInPathIndex = selectedPath.findIndex(n => n.id === node.id);
        if (nodeInPathIndex !== -1) {
            setSelectedPath(prevPath => {
                const newPath = [...prevPath];
                const oldNode = newPath[nodeInPathIndex];

                // Check if role changed from tier to competency
                if (
                    oldNode.role === FrameworkNodeRole.tier &&
                    node.role === FrameworkNodeRole.competency
                ) {
                    // If going from tier -> competency:
                    //   Remove this node and all subsequent nodes from the selected path
                    return newPath.slice(0, nodeInPathIndex);
                }

                // Otherwise, just update the node
                newPath[nodeInPathIndex] = { ...node };
                return newPath;
            });
        }

        // Check if the node exists in addedNodes (to be created)
        let nodeFound = false;
        const updatedAddedNodes = { ...addedNodes };

        // Search through all parent nodes in addedNodes
        for (const parentId in updatedAddedNodes) {
            const nodeIndex = updatedAddedNodes[parentId].findIndex(n => n.id === node.id);
            if (nodeIndex !== -1) {
                // Update the node in addedNodes
                updatedAddedNodes[parentId] = updatedAddedNodes[parentId].map((n, i) =>
                    i === nodeIndex ? { ...n, ...node } : n
                );
                nodeFound = true;
                break;
            }
        }

        if (nodeFound) {
            setAddedNodes(updatedAddedNodes);
        } else {
            // If node wasn't found in addedNodes, add it to editedNodes
            setEditedNodes(prev => ({
                ...prev,
                [node.id]: { ...node, path: [...path, node] },
            }));
        }
    };

    // Recursively collect all descendant node IDs from addedNodes
    const collectDescendantIds = (
        nodeId: string,
        nodesMap: Record<string, SkillFrameworkNode[]>
    ): string[] => {
        const descendants: string[] = [];

        // If this node has children in addedNodes, process them
        if (nodesMap[nodeId]) {
            nodesMap[nodeId].forEach(child => {
                descendants.push(child.id);
                // Recursively collect descendants
                const childDescendants = collectDescendantIds(child.id, nodesMap);
                descendants.push(...childDescendants);
            });
        }

        return descendants;
    };

    const handleDeleteNode = (
        node: SkillFrameworkNode,
        numberOfSkillsDeleted: number,
        parentPathIds: string[]
    ) => {
        const updatedAddedNodes = { ...addedNodes };
        const nodesToDelete = new Set<string>();

        // Update count adjustments for all parent nodes
        if (numberOfSkillsDeleted > 0) {
            updateParentCounts(-numberOfSkillsDeleted, parentPathIds);
        }

        // First, find the node and all its descendants
        const findAndMarkForDeletion = (targetNode: SkillFrameworkNode) => {
            let foundInAddedNodes = false;

            // Look for the node in all parent entries
            for (const parentId in updatedAddedNodes) {
                const nodeIndex = updatedAddedNodes[parentId].findIndex(
                    n => n.id === targetNode.id
                );
                if (nodeIndex !== -1) {
                    // Add this node to the deletion set
                    nodesToDelete.add(targetNode.id);
                    foundInAddedNodes = true;

                    // Recursively find and mark all descendants
                    const descendants = collectDescendantIds(targetNode.id, updatedAddedNodes);
                    descendants.forEach(id => nodesToDelete.add(id));

                    // Remove the node from its parent
                    updatedAddedNodes[parentId] = updatedAddedNodes[parentId].filter(
                        n => n.id !== targetNode.id
                    );

                    // Clean up empty parent entries
                    if (updatedAddedNodes[parentId].length === 0) {
                        delete updatedAddedNodes[parentId];
                    }

                    break;
                }
            }

            return foundInAddedNodes;
        };

        // Try to find and mark the node and its descendants for deletion
        const wasInAddedNodes = findAndMarkForDeletion(node);

        // Update the addedNodes state if we removed anything
        if (wasInAddedNodes) {
            // Remove any nodes that were marked for deletion from all parent entries
            for (const parentId in updatedAddedNodes) {
                updatedAddedNodes[parentId] = updatedAddedNodes[parentId].filter(
                    n => !nodesToDelete.has(n.id)
                );
            }

            // Clean up any empty parent entries
            for (const parentId in updatedAddedNodes) {
                if (updatedAddedNodes[parentId].length === 0) {
                    delete updatedAddedNodes[parentId];
                }
            }

            setAddedNodes(updatedAddedNodes);
        } else {
            // If node wasn't found in addedNodes, add it to deletedNodeIds
            // We still need to check if any of its descendants are in addedNodes
            const allDescendantIds = collectDescendantIds(node.id, updatedAddedNodes);

            if (allDescendantIds.length > 0) {
                // If there are descendants in addedNodes, remove them
                const updatedNodes = { ...updatedAddedNodes };
                allDescendantIds.forEach(id => nodesToDelete.add(id));

                for (const parentId in updatedNodes) {
                    updatedNodes[parentId] = updatedNodes[parentId].filter(
                        n => !nodesToDelete.has(n.id)
                    );

                    if (updatedNodes[parentId].length === 0) {
                        delete updatedNodes[parentId];
                    }
                }

                setAddedNodes(updatedNodes);
            }

            // Add the original node to deletedNodes
            setDeletedNodes(prev => [...prev, node]);
        }

        // when deleting a node, deleted it from the nodes in selectedPath
        //   also delete from subskills of parent node
        let updatedSelectedPath = cloneDeep(selectedPath);

        // Find the index of the node being deleted
        const nodeIndex = updatedSelectedPath.findIndex(n => n.id === node.id);

        if (nodeIndex > 0) {
            // Get the parent node (the one before the current node in the path)
            const parentNode: SkillFrameworkNode = { ...updatedSelectedPath[nodeIndex - 1] };

            if (parentNode) {
                // Create a new subskills array without the deleted node
                const updatedSubskills = (parentNode.subskills || []).filter(
                    (subskill: SkillFrameworkNode) => subskill.id !== node.id
                );

                // Update the parent node with the new subskills array
                parentNode.subskills = updatedSubskills.length > 0 ? updatedSubskills : undefined;

                // Update the parent node in the selected path
                updatedSelectedPath[nodeIndex - 1] = parentNode;
            }
        }

        // Filter out the deleted node and any nodes marked for deletion
        updatedSelectedPath = updatedSelectedPath.filter(
            n => n.id !== node.id && !nodesToDelete.has(n.id)
        );

        // Update the selected path with the filtered and updated path
        setSelectedPath(updatedSelectedPath);
    };

    const getChangeCounts = () => {
        // Count skills and tiers in added nodes
        const allAddedNodes = Object.values(addedNodes).flat();
        const addedSkills = allAddedNodes.filter(
            node => node.role === FrameworkNodeRole.competency
        ).length;
        const addedTiers = allAddedNodes.filter(
            node => node.role === FrameworkNodeRole.tier
        ).length;

        // Count skills and tiers in edited nodes
        const editedNodesList = Object.values(editedNodes);
        const editedSkills = editedNodesList.filter(
            node => node.role === FrameworkNodeRole.competency
        ).length;
        const editedTiers = editedNodesList.filter(
            node => node.role === FrameworkNodeRole.tier
        ).length;

        // Count skills and tiers in deleted nodes
        const deletedSkills = deletedNodes.filter(
            node => node.role === FrameworkNodeRole.competency
        ).length;
        const deletedTiers = deletedNodes.length - deletedSkills; // The rest are tiers

        return {
            addedSkills,
            addedTiers,
            editedSkills,
            editedTiers,
            deletedSkills,
            deletedTiers,
            totalChanges:
                addedSkills +
                addedTiers +
                editedSkills +
                editedTiers +
                deletedSkills +
                deletedTiers,
        };
    };

    const handleApprove = async () => {
        if (handleApproveOverride && fullSkillTree) {
            // account for edits, adds, and deletes in fullSkillTree
            let updatedFullSkillTree = cloneDeep(fullSkillTree);
            updatedFullSkillTree = updatedFullSkillTree
                .filter(node => {
                    const isDeleted = deletedNodes.some(deletedNode => deletedNode.id === node.id);
                    return !isDeleted;
                })
                .map(node => {
                    if (editedNodes[node.id!]) {
                        return editedNodes[node.id!];
                    }
                    return node;
                });

            // Merge added nodes into the fullSkillTree while maintaining the hierarchy
            const mergeNodes = (
                nodes: SkillFrameworkNode[],
                parentId: string | null = null
            ): SkillFrameworkNode[] => {
                const nodeList = [...nodes];

                // Get nodes that should be children of the current parent
                const currentParentId = parentId === 'root' ? null : parentId;
                const directChildren = addedNodes[currentParentId ?? 'root'] || [];

                // Add direct children to the node list
                nodeList.push(...directChildren);

                // Recursively process children of each node
                return nodeList.map(node => ({
                    ...node,
                    subskills: mergeNodes(node.subskills || [], node.id),
                }));
            };

            // Start merging from the root
            updatedFullSkillTree = mergeNodes(updatedFullSkillTree);

            handleApproveOverride(updatedFullSkillTree);
            return;
        }

        const wallet = await initWallet();

        if (changesExist) {
            const {
                addedSkills,
                addedTiers,
                editedSkills,
                editedTiers,
                deletedSkills,
                deletedTiers,
            } = getChangeCounts();

            newModal(
                <ManageSkillsConfirmationModal
                    mainText="Update Framework?"
                    changeCounts={{
                        skillsCreated: addedSkills,
                        tiersCreated: addedTiers,
                        skillsUpdated: editedSkills,
                        tiersUpdated: editedTiers,
                        skillsDeleted: deletedSkills,
                        tiersDeleted: deletedTiers,
                    }}
                    confirmationButtonText="Yes, Update"
                    onConfirm={async () => {
                        try {
                            // Add skills
                            const addPromises = Object.keys(addedNodes).map(parentId => {
                                const addedSkills = addedNodes[parentId];
                                return wallet.invoke.createSkills({
                                    frameworkId: frameworkInfo.id,
                                    skills: addedSkills.map(node =>
                                        convertSkillToBackendFormat(node)
                                    ),
                                    parentId: parentId === 'root' ? null : parentId,
                                });
                            });

                            // Update edited skills
                            const updatePromises = Object.values(editedNodes).map(editedSkill =>
                                wallet.invoke.updateSkill({
                                    frameworkId: frameworkInfo.id,
                                    ...convertSkillToBackendFormat(editedSkill),
                                })
                            );

                            // Delete removed skills
                            const deletePromises = deletedNodes.map(node =>
                                wallet.invoke.deleteSkill({
                                    frameworkId: frameworkInfo.id,
                                    id: node.id || '',
                                })
                            );

                            // Wait for all operations to complete
                            await Promise.all([
                                ...addPromises,
                                ...updatePromises,
                                ...deletePromises,
                            ]);

                            // Clear the edit state
                            handleResetEdits();

                            // Invalidate queries to refresh data
                            await queryClient.invalidateQueries({
                                queryKey: ['getSkillFrameworkById', frameworkInfo.id],
                            });
                            await queryClient.invalidateQueries({
                                queryKey: ['countSkillsInFramework', frameworkInfo.id],
                            });
                            await queryClient.invalidateQueries({
                                queryKey: ['getSkillChildren', frameworkInfo.id],
                            });
                            await queryClient.invalidateQueries({
                                queryKey: ['searchFrameworkSkills', frameworkInfo.id],
                            });

                            // TODO: isSaving state (?)
                            const successCounts = getChangeCounts();

                            newModal(
                                <FrameworkUpdatedSucessModal
                                    frameworkInfo={frameworkInfo}
                                    changeCounts={{
                                        skillsCreated: successCounts.addedSkills,
                                        tiersCreated: successCounts.addedTiers,
                                        skillsUpdated: successCounts.editedSkills,
                                        tiersUpdated: successCounts.editedTiers,
                                        skillsDeleted: successCounts.deletedSkills,
                                        tiersDeleted: successCounts.deletedTiers,
                                    }}
                                    handleBrowseFramework={() => {
                                        setIsEdit(false);
                                        setSelectedPath([]);
                                    }}
                                    useCloseAllModals={false}
                                    onClose={closeAllModals}
                                />,
                                {
                                    sectionClassName:
                                        '!bg-transparent !shadow-none !overflow-visible',
                                    onClose: () => {
                                        // close modals if they exist success modal via clicking on background space
                                        // closeAllModals();
                                    },
                                },
                                {
                                    desktop: ModalTypes.Center,
                                    mobile: ModalTypes.Center,
                                }
                            );

                            setIsEdit(false);
                        } catch (error) {
                            presentToast(`Error updating skills: ${error}`, {
                                title: 'Update Failed',
                                hasDismissButton: true,
                                toastType: ToastTypeEnum.Error,
                                duration: 10000,
                            });
                            console.error('Error updating skills:', error);
                        }
                    }}
                />,
                {
                    sectionClassName: '!bg-transparent !shadow-none !overflow-visible',
                },
                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
            );
        } else {
            setIsEdit(false);
        }
    };

    const handleDisableEdit = () => {
        if (changesExist) {
            newModal(
                <ManageSkillsCancelUpdateModal
                    confirmationText="Yes, Discard Changes"
                    onCancel={() => {
                        closeModal();
                        setTimeout(() => {
                            handleResetEdits();
                            setIsEdit(false);
                        }, 301);
                    }}
                />,
                { sectionClassName: '!bg-transparent !shadow-none !overflow-visible' },
                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
            );
        } else {
            handleResetEdits();
            setIsEdit(false);
        }
    };

    const onSearchResultItemClick = (
        node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo,
        path: SkillFrameworkNode[]
    ) => {
        const isTier = node.role === FrameworkNodeRole.tier;
        const isCompetency = node.role === FrameworkNodeRole.competency;

        setSearch('');
        setIsFullScreenSearch(false);
        setSelectedPath(isTier ? path : path.slice(0, -1));

        if (isCompetency) {
            newModal(
                <ViewAlignmentInfo
                    alignment={node}
                    framework={frameworkInfo}
                    selectedPath={selectedPath}
                />,
                undefined,
                {
                    desktop: ModalTypes.FullScreen,
                    mobile: ModalTypes.FullScreen,
                }
            );
        }
    };

    const handleToggleSkill = (node: SkillFrameworkNode) => {
        if (selectedSkills?.some(skill => skill.id === node.id)) {
            setSelectedSkills(selectedSkills.filter(skill => skill.id !== node.id));
        } else {
            // Attach frameworkId so backend can create the relationship
            const skillWithFramework = { ...node, frameworkId: frameworkInfo.id };
            setSelectedSkills([...(selectedSkills || []), skillWithFramework]);
        }
    };

    const handleSaveSkills = () => {
        _setSelectedSkills?.(selectedSkills);
        closeModal();
    };

    const handleClose = () => {
        if (changesExist) {
            newModal(
                <ManageSkillsCancelUpdateModal
                    confirmationText="Yes, Cancel & Exit"
                    onCancel={() => {
                        closeModal();
                        setTimeout(() => {
                            _handleClose();
                        }, 301);
                    }}
                />,
                { sectionClassName: '!bg-transparent !shadow-none !overflow-visible' },
                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
            );
        } else {
            _handleClose();
        }
    };

    const isNodeInSelectedPath = (node: SkillFrameworkNode) =>
        selectedPath.some(n => n.id === node.id);

    const columns: React.ReactNode[] = [
        <FrameworkColumn
            key="root"
            nodes={fullSkillTree ?? convertApiSkillNodesToSkillFrameworkNodes(apiSkills || [])}
            setSelectedNode={node => {
                // If we already have a selected path, replace the first item
                // Otherwise, start a new path
                if (selectedPath.length > 0) {
                    setSelectedPath([node]);
                } else {
                    setSelectedPath([node]);
                }
            }}
            isNodeInSelectedPath={isNodeInSelectedPath}
            frameworkInfo={frameworkInfo}
            isTopLevel={true}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            handleEdit={handleEditNode}
            handleDelete={handleDeleteNode}
            handleAdd={handleCreateNode}
            addedNodes={addedNodes}
            editedNodes={editedNodes}
            deletedNodes={deletedNodes}
            maxColumns={maxColumns}
            isFullSkillFramework={isFullSkillFramework}
            isApproveFlow={isApproveFlow}
            handleApprove={handleApprove}
            search={search}
            setSearch={setSearch}
            selectedPath={[]}
            setSelectedPath={setSelectedPath}
            handleDisableEdit={handleDisableEdit}
            openManageJsonModal={openManageJsonModal}
            changesExist={changesExist}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onSearchResultItemClick={onSearchResultItemClick}
            countAdjustments={countAdjustments}
            isSelectSkillsFlow={isSelectSkillsFlow}
            selectedSkills={selectedSkills}
            handleToggleSkill={handleToggleSkill}
            handleClose={handleClose}
            handleSaveSkills={handleSaveSkills}
            disableSave={disableSave}
            isViewOnly={isViewOnly}
        />,
        ...selectedPath.map((node, index) => {
            // The actual column index is index + 1 because the root column is at index 0
            const columnIndex = index + 1;
            return (
                <FrameworkColumn
                    key={index}
                    columnNode={node}
                    nodes={node.subskills || []}
                    setSelectedNode={selectedNode => {
                        // Create a new path that includes:
                        // 1. All nodes up to the current column
                        // 2. The current column's node
                        // 3. The newly selected node
                        // This replaces any nodes after the current column
                        const newPath = selectedPath.slice(0, columnIndex).concat(selectedNode);
                        setSelectedPath(newPath);
                    }}
                    isNodeInSelectedPath={isNodeInSelectedPath}
                    selectedPath={selectedPath.slice(0, columnIndex)}
                    frameworkInfo={frameworkInfo}
                    isEdit={isEdit}
                    handleEdit={handleEditNode}
                    handleDelete={handleDeleteNode}
                    handleAdd={handleCreateNode}
                    addedNodes={addedNodes}
                    editedNodes={editedNodes}
                    deletedNodes={deletedNodes}
                    maxColumns={maxColumns}
                    isFullSkillFramework={isFullSkillFramework}
                    showBackInFooter
                    handleBack={handleBack}
                    isApproveFlow={isApproveFlow}
                    handleApprove={handleApprove}
                    search={search}
                    setSearch={setSearch}
                    setSelectedPath={setSelectedPath}
                    setIsEdit={setIsEdit}
                    handleDisableEdit={handleDisableEdit}
                    openManageJsonModal={openManageJsonModal}
                    changesExist={changesExist}
                    searchResults={searchResults}
                    searchLoading={searchLoading}
                    onSearchResultItemClick={onSearchResultItemClick}
                    countAdjustments={countAdjustments}
                    isSelectSkillsFlow={isSelectSkillsFlow}
                    selectedSkills={selectedSkills}
                    handleToggleSkill={handleToggleSkill}
                    handleClose={handleClose}
                    handleSaveSkills={handleSaveSkills}
                    disableSave={disableSave}
                    isViewOnly={isViewOnly}
                />
            );
        }),
    ];

    useEffect(() => {
        const pageElement = pageRef.current;
        if (!pageElement) return;

        const resizeObserver = new ResizeObserver(entries => {
            const { width } = entries[0].contentRect;
            setPageWidth(width);
        });

        resizeObserver.observe(pageElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const useShortText = pageWidth < 989;

    return (
        <IonPage ref={pageRef} className="bg-white text-grayscale-900">
            {maxColumns > 1 && (
                <BrowseFrameworkMultiColumnHeader
                    handleBack={handleBack}
                    backDisabled={columns.length <= 1}
                    handleApprove={handleApprove}
                    handleClose={handleClose}
                    search={search}
                    setSearch={setSearch}
                    searchResults={searchResults}
                    searchLoading={searchLoading}
                    isEdit={isEdit}
                    setIsEdit={setIsEdit}
                    handleDisableEdit={handleDisableEdit}
                    isApproveFlow={isApproveFlow}
                    changesExist={changesExist}
                    useShortText={useShortText}
                    openManageJsonModal={openManageJsonModal}
                    frameworkInfo={frameworkInfo}
                    isFullScreenSearch={isFullScreenSearch}
                    setIsFullScreenSearch={setIsFullScreenSearch}
                    onSearchResultItemClick={onSearchResultItemClick}
                    isSelectSkillsFlow={isSelectSkillsFlow}
                    selectedSkills={selectedSkills}
                    handleToggleSkill={handleToggleSkill}
                    handleSaveSkills={handleSaveSkills}
                    disableSave={disableSave}
                    isViewOnly={isViewOnly}
                />
            )}

            {isLoading && !isFullSkillFramework ? (
                <div className="w-full h-full flex items-center justify-center">
                    <IonSpinner name="crescent" />
                </div>
            ) : (
                <div className="flex w-full relative h-full overflow-y-hidden">
                    {search && maxColumns > 1 && !isFullScreenSearch && (
                        <div className="absolute h-full w-full bg-grayscale-100 bg-opacity-50 backdrop-blur-[15px] z-[1]" />
                    )}

                    {isFullScreenSearch && (
                        <FrameworkSearchResults
                            searchResults={searchResults}
                            frameworkInfo={frameworkInfo}
                            className="!pt-[15px] !pb-[200px]"
                            onClick={onSearchResultItemClick}
                            isSelectSkillsFlow={isSelectSkillsFlow}
                            selectedSkills={selectedSkills}
                            handleToggleSkill={handleToggleSkill}
                        />
                    )}
                    {!isFullScreenSearch && (
                        <>
                            {columns.slice(-maxColumns)}
                            {columns.length < maxColumns && (
                                <div className="flex flex-1 bg-grayscale-10 items-center justify-center">
                                    <SkillsFrameworkIcon
                                        className="w-[100px] h-[100px] text-grayscale-400"
                                        version="filled-dots"
                                        color="currentColor"
                                        strokeWidth="1"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </IonPage>
    );
};

export default BrowseFrameworkPage;
