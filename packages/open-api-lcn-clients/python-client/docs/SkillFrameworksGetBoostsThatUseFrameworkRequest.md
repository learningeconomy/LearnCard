# SkillFrameworksGetBoostsThatUseFrameworkRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **int** |  | [optional] [default to 50]
**cursor** | **str** |  | [optional] 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.skill_frameworks_get_boosts_that_use_framework_request import SkillFrameworksGetBoostsThatUseFrameworkRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksGetBoostsThatUseFrameworkRequest from a JSON string
skill_frameworks_get_boosts_that_use_framework_request_instance = SkillFrameworksGetBoostsThatUseFrameworkRequest.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksGetBoostsThatUseFrameworkRequest.to_json())

# convert the object into a dict
skill_frameworks_get_boosts_that_use_framework_request_dict = skill_frameworks_get_boosts_that_use_framework_request_instance.to_dict()
# create an instance of SkillFrameworksGetBoostsThatUseFrameworkRequest from a dict
skill_frameworks_get_boosts_that_use_framework_request_from_dict = SkillFrameworksGetBoostsThatUseFrameworkRequest.from_dict(skill_frameworks_get_boosts_that_use_framework_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


