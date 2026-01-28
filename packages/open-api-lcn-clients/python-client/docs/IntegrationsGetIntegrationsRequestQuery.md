# IntegrationsGetIntegrationsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**description** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**status** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**guide_type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 

## Example

```python
from openapi_client.models.integrations_get_integrations_request_query import IntegrationsGetIntegrationsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsGetIntegrationsRequestQuery from a JSON string
integrations_get_integrations_request_query_instance = IntegrationsGetIntegrationsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(IntegrationsGetIntegrationsRequestQuery.to_json())

# convert the object into a dict
integrations_get_integrations_request_query_dict = integrations_get_integrations_request_query_instance.to_dict()
# create an instance of IntegrationsGetIntegrationsRequestQuery from a dict
integrations_get_integrations_request_query_from_dict = IntegrationsGetIntegrationsRequestQuery.from_dict(integrations_get_integrations_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


