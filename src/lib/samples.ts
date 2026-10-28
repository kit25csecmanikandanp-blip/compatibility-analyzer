/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleComparison {
  id: string;
  name: string;
  description: string;
  v1Name: string;
  v2Name: string;
  v1Spec: string;
  v2Spec: string;
  format: 'json' | 'yaml';
}

export const SAMPLE_COMPARISONS: SampleComparison[] = [
  {
    id: 'ecommerce-orders',
    name: 'E-Commerce Orders & Checkout API',
    description: 'Realistic microservice evolution containing removed DELETE endpoint, mandatory auth header, schema type transitions, and removed discount parameters.',
    v1Name: 'OrderService v1.4 (Legacy)',
    v2Name: 'OrderService v2.0 (Modernized)',
    format: 'json',
    v1Spec: JSON.stringify(
      {
        openapi: "3.0.3",
        info: {
          title: "E-Commerce Orders & Catalog API",
          version: "1.4.0",
          description: "Legacy order management service handling checkout and fulfillment."
        },
        paths: {
          "/orders": {
            get: {
              summary: "List all orders",
              operationId: "listOrders",
              parameters: [
                {
                  name: "status",
                  in: "query",
                  required: false,
                  schema: { type: "string", enum: ["pending", "processing", "shipped", "cancelled", "archived"] }
                },
                {
                  name: "discountCode",
                  in: "query",
                  required: false,
                  schema: { type: "string" },
                  description: "Filter orders where a discount voucher was applied."
                },
                {
                  name: "limit",
                  in: "query",
                  required: false,
                  schema: { type: "integer", default: 20 }
                }
              ],
              responses: {
                "200": {
                  description: "Order list retrieved",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          orders: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["id", "customerEmail", "totalAmount"],
                              properties: {
                                id: { type: "integer" },
                                customerEmail: { type: "string" },
                                totalAmount: { type: "number" },
                                legacyReceiptNumber: { type: "string" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: "Create a new order",
              operationId: "createOrder",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["customerEmail", "items"],
                      properties: {
                        customerEmail: { type: "string" },
                        items: { type: "array" },
                        shippingAddress: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "201": {
                  description: "Created order",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["id", "status"],
                        properties: {
                          id: { type: "integer" },
                          status: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "/orders/{id}": {
            get: {
              summary: "Get order details",
              parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
              ],
              responses: {
                "200": {
                  description: "Order details",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          customerEmail: { type: "string" },
                          totalAmount: { type: "number" },
                          legacyReceiptNumber: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            },
            delete: {
              summary: "Cancel order (Deprecated)",
              parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
              ],
              responses: {
                "200": {
                  description: "Order deleted successfully"
                }
              }
            }
          },
          "/legacy-tax-calc": {
            get: {
              summary: "Legacy tax calculation endpoint",
              responses: {
                "200": { description: "Calculated tax" }
              }
            }
          }
        }
      },
      null,
      2
    ),
    v2Spec: JSON.stringify(
      {
        openapi: "3.0.3",
        info: {
          title: "E-Commerce Orders & Catalog API",
          version: "2.0.0",
          description: "Modernized high-throughput order microservice with UUID keys and strict security."
        },
        security: [
          { "ApiKeyAuth": [] }
        ],
        paths: {
          "/orders": {
            get: {
              summary: "List all orders",
              operationId: "listOrders",
              parameters: [
                {
                  name: "status",
                  in: "query",
                  required: false,
                  // enum restricted: removed "archived"
                  schema: { type: "string", enum: ["pending", "processing", "shipped", "cancelled"] }
                },
                // discountCode was REMOVED
                {
                  name: "limit",
                  in: "query",
                  required: false,
                  schema: { type: "integer", default: 50 }
                },
                // New required header parameter added!
                {
                  name: "X-Tenant-ID",
                  in: "header",
                  required: true,
                  schema: { type: "string" },
                  description: "Mandatory multi-tenant customer identifier."
                }
              ],
              responses: {
                "200": {
                  description: "Order list retrieved",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          orders: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["id", "customerEmail", "totalAmount"],
                              properties: {
                                // Type changed integer -> string (UUID)
                                id: { type: "string", format: "uuid" },
                                customerEmail: { type: "string" },
                                totalAmount: { type: "number" },
                                // legacyReceiptNumber was REMOVED from response
                                currency: { type: "string" }, // ADDED non-breaking
                                taxAmount: { type: "number" } // ADDED non-breaking
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            post: {
              summary: "Create a new order",
              operationId: "createOrder",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      // shippingAddress changed from optional to REQUIRED!
                      required: ["customerEmail", "items", "shippingAddress"],
                      properties: {
                        customerEmail: { type: "string" },
                        items: { type: "array" },
                        shippingAddress: { type: "string" }
                      }
                    }
                  }
                }
              },
              responses: {
                "201": {
                  description: "Created order",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        required: ["id", "status"],
                        properties: {
                          id: { type: "string", format: "uuid" },
                          status: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "/orders/{id}": {
            get: {
              summary: "Get order details",
              parameters: [
                // Type changed integer -> string
                { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
              ],
              responses: {
                "200": {
                  description: "Order details",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          customerEmail: { type: "string" },
                          totalAmount: { type: "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
            // DELETE /orders/{id} has been completely REMOVED!
          },
          // /legacy-tax-calc was REMOVED!
          "/orders/bulk-export": {
            // Brand NEW endpoint
            post: {
              summary: "Trigger bulk export of orders",
              responses: {
                "202": { description: "Export task scheduled" }
              }
            }
          }
        }
      },
      null,
      2
    )
  },
  {
    id: 'user-identity',
    name: 'User & Authentication Identity API (YAML)',
    description: 'YAML-formatted specification showcasing OAuth transition, removed fields, and enum restrictions.',
    v1Name: 'IdentityAPI v1.0',
    v2Name: 'IdentityAPI v2.0',
    format: 'yaml',
    v1Spec: `openapi: 3.0.0
info:
  title: User Identity Service
  version: 1.0.0
paths:
  /users:
    get:
      summary: Retrieve users list
      parameters:
        - name: role
          in: query
          required: false
          schema:
            type: string
            enum: [admin, member, guest, contractor]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                        ssn:
                          type: string
  /users/{id}/credentials:
    delete:
      summary: Revoke user credentials
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Revoked
`,
    v2Spec: `openapi: 3.0.0
info:
  title: User Identity Service
  version: 2.0.0
paths:
  /users:
    get:
      summary: Retrieve users list
      security:
        - BearerAuth: []
      parameters:
        - name: role
          in: query
          required: false
          schema:
            type: string
            enum: [admin, member]
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  users:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        name:
                          type: string
                        avatarUrl:
                          type: string
`
  }
];
