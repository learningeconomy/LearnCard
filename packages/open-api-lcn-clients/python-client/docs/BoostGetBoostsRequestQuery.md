# BoostGetBoostsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**var_or** | [**List[BoostGetBoostsRequestQueryAnyOfOrInner]**](BoostGetBoostsRequestQueryAnyOfOrInner.md) |  | 
**uri** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**category** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**meta** | [**Dict[str, BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement]**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**status** | [**BoostGetBoostsRequestQueryAnyOfOrInnerStatus**](BoostGetBoostsRequestQueryAnyOfOrInnerStatus.md) |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boosts_request_query import BoostGetBoostsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostsRequestQuery from a JSON string
boost_get_boosts_request_query_instance = BoostGetBoostsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostsRequestQuery.to_json())

# convert the object into a dict
boost_get_boosts_request_query_dict = boost_get_boosts_request_query_instance.to_dict()
# create an instance of BoostGetBoostsRequestQuery from a dict
boost_get_boosts_request_query_from_dict = BoostGetBoostsRequestQuery.from_dict(boost_get_boosts_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


