# BoostSearchSkillsAvailableForBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**query** | [**BoostSearchSkillsAvailableForBoostRequestQuery**](BoostSearchSkillsAvailableForBoostRequestQuery.md) |  | 
**limit** | **int** |  | [optional] [default to 50]
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_search_skills_available_for_boost_request import BoostSearchSkillsAvailableForBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSearchSkillsAvailableForBoostRequest from a JSON string
boost_search_skills_available_for_boost_request_instance = BoostSearchSkillsAvailableForBoostRequest.from_json(json)
# print the JSON string representation of the object
print(BoostSearchSkillsAvailableForBoostRequest.to_json())

# convert the object into a dict
boost_search_skills_available_for_boost_request_dict = boost_search_skills_available_for_boost_request_instance.to_dict()
# create an instance of BoostSearchSkillsAvailableForBoostRequest from a dict
boost_search_skills_available_for_boost_request_from_dict = BoostSearchSkillsAvailableForBoostRequest.from_dict(boost_search_skills_available_for_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


