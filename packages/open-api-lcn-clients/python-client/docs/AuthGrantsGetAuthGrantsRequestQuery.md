# AuthGrantsGetAuthGrantsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**name** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**description** | [**BoostGetBoostsRequestQueryUri**](BoostGetBoostsRequestQueryUri.md) |  | [optional] 
**status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.auth_grants_get_auth_grants_request_query import AuthGrantsGetAuthGrantsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of AuthGrantsGetAuthGrantsRequestQuery from a JSON string
auth_grants_get_auth_grants_request_query_instance = AuthGrantsGetAuthGrantsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(AuthGrantsGetAuthGrantsRequestQuery.to_json())

# convert the object into a dict
auth_grants_get_auth_grants_request_query_dict = auth_grants_get_auth_grants_request_query_instance.to_dict()
# create an instance of AuthGrantsGetAuthGrantsRequestQuery from a dict
auth_grants_get_auth_grants_request_query_from_dict = AuthGrantsGetAuthGrantsRequestQuery.from_dict(auth_grants_get_auth_grants_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


