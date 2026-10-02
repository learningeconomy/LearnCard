# SkillFrameworksGetAllAvailableFrameworksRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **int** |  | [optional] [default to 50]
**cursor** | **str** |  | [optional] 
**query** | [**BoostGetBoostFrameworksRequestQuery**](BoostGetBoostFrameworksRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.skill_frameworks_get_all_available_frameworks_request import SkillFrameworksGetAllAvailableFrameworksRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksGetAllAvailableFrameworksRequest from a JSON string
skill_frameworks_get_all_available_frameworks_request_instance = SkillFrameworksGetAllAvailableFrameworksRequest.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksGetAllAvailableFrameworksRequest.to_json())

# convert the object into a dict
skill_frameworks_get_all_available_frameworks_request_dict = skill_frameworks_get_all_available_frameworks_request_instance.to_dict()
# create an instance of SkillFrameworksGetAllAvailableFrameworksRequest from a dict
skill_frameworks_get_all_available_frameworks_request_from_dict = SkillFrameworksGetAllAvailableFrameworksRequest.from_dict(skill_frameworks_get_all_available_frameworks_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


