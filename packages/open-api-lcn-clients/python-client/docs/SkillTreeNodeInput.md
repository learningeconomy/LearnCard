# SkillTreeNodeInput


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**statement** | **str** |  | 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**children** | [**List[SkillTreeNodeInput]**](SkillTreeNodeInput.md) |  | [optional] 

## Example

```python
from openapi_client.models.skill_tree_node_input import SkillTreeNodeInput

# TODO update the JSON string below
json = "{}"
# create an instance of SkillTreeNodeInput from a JSON string
skill_tree_node_input_instance = SkillTreeNodeInput.from_json(json)
# print the JSON string representation of the object
print(SkillTreeNodeInput.to_json())

# convert the object into a dict
skill_tree_node_input_dict = skill_tree_node_input_instance.to_dict()
# create an instance of SkillTreeNodeInput from a dict
skill_tree_node_input_from_dict = SkillTreeNodeInput.from_dict(skill_tree_node_input_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


