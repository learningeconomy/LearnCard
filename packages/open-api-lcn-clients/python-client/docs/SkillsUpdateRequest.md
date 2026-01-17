# SkillsUpdateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework_id** | **str** |  | 
**statement** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skills_update_request import SkillsUpdateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsUpdateRequest from a JSON string
skills_update_request_instance = SkillsUpdateRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsUpdateRequest.to_json())

# convert the object into a dict
skills_update_request_dict = skills_update_request_instance.to_dict()
# create an instance of SkillsUpdateRequest from a dict
skills_update_request_from_dict = SkillsUpdateRequest.from_dict(skills_update_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


