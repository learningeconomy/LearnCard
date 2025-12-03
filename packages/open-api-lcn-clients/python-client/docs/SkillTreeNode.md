# SkillTreeNode


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**statement** | **str** |  | 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [default to 'skill']
**status** | **str** |  | [default to 'active']
**framework_id** | **str** |  | [optional] 
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 
**children** | [**List[SkillTreeNode]**](SkillTreeNode.md) |  | 
**has_children** | **bool** |  | 
**children_cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skill_tree_node import SkillTreeNode

# TODO update the JSON string below
json = "{}"
# create an instance of SkillTreeNode from a JSON string
skill_tree_node_instance = SkillTreeNode.from_json(json)
# print the JSON string representation of the object
print(SkillTreeNode.to_json())

# convert the object into a dict
skill_tree_node_dict = skill_tree_node_instance.to_dict()
# create an instance of SkillTreeNode from a dict
skill_tree_node_from_dict = SkillTreeNode.from_dict(skill_tree_node_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


