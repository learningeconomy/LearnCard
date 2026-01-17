# BoostSearchSkillsAvailableForBoost200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**records** | [**List[BoostSearchSkillsAvailableForBoost200ResponseRecordsInner]**](BoostSearchSkillsAvailableForBoost200ResponseRecordsInner.md) |  | 
**has_more** | **bool** |  | 
**cursor** | **str** |  | 

## Example

```python
from openapi_client.models.boost_search_skills_available_for_boost200_response import BoostSearchSkillsAvailableForBoost200Response

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSearchSkillsAvailableForBoost200Response from a JSON string
boost_search_skills_available_for_boost200_response_instance = BoostSearchSkillsAvailableForBoost200Response.from_json(json)
# print the JSON string representation of the object
print(BoostSearchSkillsAvailableForBoost200Response.to_json())

# convert the object into a dict
boost_search_skills_available_for_boost200_response_dict = boost_search_skills_available_for_boost200_response_instance.to_dict()
# create an instance of BoostSearchSkillsAvailableForBoost200Response from a dict
boost_search_skills_available_for_boost200_response_from_dict = BoostSearchSkillsAvailableForBoost200Response.from_dict(boost_search_skills_available_for_boost200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


