# BoostGetBoostsRequestQueryAnyOf1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**category** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**meta** | [**Dict[str, BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement]**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**status** | [**BoostGetBoostsRequestQueryAnyOfOrInnerStatus**](BoostGetBoostsRequestQueryAnyOfOrInnerStatus.md) |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boosts_request_query_any_of1 import BoostGetBoostsRequestQueryAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostsRequestQueryAnyOf1 from a JSON string
boost_get_boosts_request_query_any_of1_instance = BoostGetBoostsRequestQueryAnyOf1.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostsRequestQueryAnyOf1.to_json())

# convert the object into a dict
boost_get_boosts_request_query_any_of1_dict = boost_get_boosts_request_query_any_of1_instance.to_dict()
# create an instance of BoostGetBoostsRequestQueryAnyOf1 from a dict
boost_get_boosts_request_query_any_of1_from_dict = BoostGetBoostsRequestQueryAnyOf1.from_dict(boost_get_boosts_request_query_any_of1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


