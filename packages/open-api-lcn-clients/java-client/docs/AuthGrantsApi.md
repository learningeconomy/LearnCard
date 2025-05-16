# AuthGrantsApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**authGrantsAddAuthGrant**](AuthGrantsApi.md#authGrantsAddAuthGrant) | **POST** /auth-grant/create | Add AuthGrant to your profile |
| [**authGrantsDeleteAuthGrant**](AuthGrantsApi.md#authGrantsDeleteAuthGrant) | **DELETE** /auth-grant/{id} | Delete AuthGrant |
| [**authGrantsGetAuthGrant**](AuthGrantsApi.md#authGrantsGetAuthGrant) | **GET** /auth-grant/{id} | Get AuthGrant |
| [**authGrantsGetAuthGrants**](AuthGrantsApi.md#authGrantsGetAuthGrants) | **POST** /profile/auth-grants | Get My AuthGrants |
| [**authGrantsRevokeAuthGrant**](AuthGrantsApi.md#authGrantsRevokeAuthGrant) | **POST** /auth-grant/{id}/revoke | Revoke AuthGrant |
| [**authGrantsUpdateAuthGrant**](AuthGrantsApi.md#authGrantsUpdateAuthGrant) | **POST** /auth-grant/update/{id} | Update AuthGrant |


<a id="authGrantsAddAuthGrant"></a>
# **authGrantsAddAuthGrant**
> String authGrantsAddAuthGrant(authGrantsAddAuthGrantRequest)

Add AuthGrant to your profile

Add AuthGrant to your profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    AuthGrantsAddAuthGrantRequest authGrantsAddAuthGrantRequest = new AuthGrantsAddAuthGrantRequest(); // AuthGrantsAddAuthGrantRequest | 
    try {
      String result = apiInstance.authGrantsAddAuthGrant(authGrantsAddAuthGrantRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsAddAuthGrant");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **authGrantsAddAuthGrantRequest** | [**AuthGrantsAddAuthGrantRequest**](AuthGrantsAddAuthGrantRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="authGrantsDeleteAuthGrant"></a>
# **authGrantsDeleteAuthGrant**
> Boolean authGrantsDeleteAuthGrant(id)

Delete AuthGrant

Delete AuthGrant

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      Boolean result = apiInstance.authGrantsDeleteAuthGrant(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsDeleteAuthGrant");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="authGrantsGetAuthGrant"></a>
# **authGrantsGetAuthGrant**
> AuthGrantsGetAuthGrant200Response authGrantsGetAuthGrant(id)

Get AuthGrant

Get AuthGrant

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      AuthGrantsGetAuthGrant200Response result = apiInstance.authGrantsGetAuthGrant(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsGetAuthGrant");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | **String**|  | |

### Return type

[**AuthGrantsGetAuthGrant200Response**](AuthGrantsGetAuthGrant200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="authGrantsGetAuthGrants"></a>
# **authGrantsGetAuthGrants**
> List&lt;AuthGrantsGetAuthGrants200ResponseInner&gt; authGrantsGetAuthGrants(authGrantsGetAuthGrantsRequest)

Get My AuthGrants

Get My AuthGrants

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    AuthGrantsGetAuthGrantsRequest authGrantsGetAuthGrantsRequest = new AuthGrantsGetAuthGrantsRequest(); // AuthGrantsGetAuthGrantsRequest | 
    try {
      List<AuthGrantsGetAuthGrants200ResponseInner> result = apiInstance.authGrantsGetAuthGrants(authGrantsGetAuthGrantsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsGetAuthGrants");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **authGrantsGetAuthGrantsRequest** | [**AuthGrantsGetAuthGrantsRequest**](AuthGrantsGetAuthGrantsRequest.md)|  | [optional] |

### Return type

[**List&lt;AuthGrantsGetAuthGrants200ResponseInner&gt;**](AuthGrantsGetAuthGrants200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="authGrantsRevokeAuthGrant"></a>
# **authGrantsRevokeAuthGrant**
> Boolean authGrantsRevokeAuthGrant(id)

Revoke AuthGrant

Revoke AuthGrant

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      Boolean result = apiInstance.authGrantsRevokeAuthGrant(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsRevokeAuthGrant");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="authGrantsUpdateAuthGrant"></a>
# **authGrantsUpdateAuthGrant**
> Boolean authGrantsUpdateAuthGrant(id, authGrantsUpdateAuthGrantRequest)

Update AuthGrant

Update AuthGrant

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.AuthGrantsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    AuthGrantsApi apiInstance = new AuthGrantsApi(defaultClient);
    String id = "id_example"; // String | 
    AuthGrantsUpdateAuthGrantRequest authGrantsUpdateAuthGrantRequest = new AuthGrantsUpdateAuthGrantRequest(); // AuthGrantsUpdateAuthGrantRequest | 
    try {
      Boolean result = apiInstance.authGrantsUpdateAuthGrant(id, authGrantsUpdateAuthGrantRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AuthGrantsApi#authGrantsUpdateAuthGrant");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | **String**|  | |
| **authGrantsUpdateAuthGrantRequest** | [**AuthGrantsUpdateAuthGrantRequest**](AuthGrantsUpdateAuthGrantRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

