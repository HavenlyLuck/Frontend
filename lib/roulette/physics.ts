import Box2DFactory from 'box2d-wasm'

// 갈톤 보드(Galton board) + 장애물이 있는 추첨 무대.
// 위에서 응모권 수만큼 구슬을 떨어뜨리고, 못과 회전 장애물에 튕기다가
// GOAL_Y 선을 넘는 순서를 기록해 "가장 마지막에 떨어진" 구슬이 당첨이다.
// 좌표 단위는 Box2D 월드 유닛이며, 캔버스에 그릴 때는 아래 값들을 기준으로 스케일링한다.
export const WORLD_WIDTH = 20
const PEG_START_Y = 4.5
const PEG_ROWS = 8
const PEG_ROW_SPACING = 1.9
const PEG_LAST_ROW_Y = PEG_START_Y + (PEG_ROWS - 1) * PEG_ROW_SPACING
export const GOAL_Y = PEG_LAST_ROW_Y + 4.5
export const FLOOR_Y = GOAL_Y + 1.5
const SPAWN_TOP_Y = -3

// 결승선 직전 좁은 구간 (마지막 몇 개가 남았을 때 카메라가 확대해서 보여줄 영역)
export const NECK_TOP_Y = GOAL_Y - 3.4
export const NECK_BOTTOM_Y = GOAL_Y - 1.1
export const NECK_HALF_GAP = 2.6
export const FINAL_ZONE_CENTER_Y = (NECK_TOP_Y + GOAL_Y) / 2

// 대기 줄(셔플 미리보기)과 실제 스폰 위치가 같은 규칙을 쓰도록 공용 함수로 분리
export function computeSpawnPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.min(total, 12)
  const col = index % cols
  const row = Math.floor(index / cols)
  const x = 2 + col * ((WORLD_WIDTH - 4) / Math.max(1, cols - 1 || 1))
  const y = SPAWN_TOP_Y - row * 1.1
  return { x, y }
}

// 캔버스에 표시할 세로 범위 (이 범위를 캔버스 높이에 맞춰 스케일링한다)
export const VIEW_TOP = SPAWN_TOP_Y - 2.5
export const VIEW_BOTTOM = FLOOR_Y + 1

export const MARBLE_RADIUS = 0.28

// 사이트 다크 컬렉터블 토큰(globals.css :root)과 맞춘 색 — 캔버스라 var()를 못 써서 값만 그대로 복사.
// 원래는 채도 100%짜리 네온(주황/보라/핫핑크/시안)이었는데 사이트 톤과 안 맞아서 골드/레드 체계로 교체.
const PEG_COLOR = '#d4af6a' // --gold
const PADDLE_COLOR = '#e0384c' // --accent
const BUMPER_COLOR = '#ff4d63' // --danger (막판 구간 긴장감)
const FUNNEL_COLOR = '#3a3d4a' // --border-strong (구조용 벽, 시선을 끌 필요 없음)
const FINAL_PADDLE_COLOR = '#e0384c' // --accent (다른 회전 장애물과 동일 계열 유지)

export interface MarbleSpec {
  id: number
  entryNumber: number
  color: string
}

export interface MarbleState {
  id: number
  entryNumber: number
  color: string
  x: number
  y: number
  angle: number
}

export interface ObstacleState {
  kind: 'circle' | 'box'
  x: number
  y: number
  angle: number
  radius?: number
  halfWidth?: number
  halfHeight?: number
  color: string
}

interface Obstacle {
  body: Box2D.b2Body
  kind: 'circle' | 'box'
  radius?: number
  halfWidth?: number
  halfHeight?: number
  color: string
}

type Box2DNamespace = typeof Box2D & EmscriptenModule

const STUCK_CHECK_FRAMES = 90 // 1.5초(60fps 기준)마다 정체 여부 체크

export class MarbleDrawSim {
  private Box2D!: Box2DNamespace
  private world!: Box2D.b2World
  private bodies = new Map<number, Box2D.b2Body>()
  private specs = new Map<number, MarbleSpec>()
  private obstacles: Obstacle[] = []
  private started = false
  private totalMarbles = 0
  private finishOrder: number[] = []
  private stuckTrackers = new Map<number, { checkY: number; framesLeft: number }>()

  async init() {
    this.Box2D = (await Box2DFactory()) as Box2DNamespace
    this.world = new this.Box2D.b2World(new this.Box2D.b2Vec2(0, 20))
    this.buildStage()
  }

  private buildStage() {
    const B = this.Box2D

    const addStaticBox = (x: number, y: number, halfW: number, halfH: number, angleDeg = 0, color?: string) => {
      const bodyDef = new B.b2BodyDef()
      bodyDef.set_type(B.b2_staticBody)
      bodyDef.set_position(new B.b2Vec2(x, y))
      bodyDef.set_angle((angleDeg * Math.PI) / 180)
      const body = this.world.CreateBody(bodyDef)
      const shape = new B.b2PolygonShape()
      shape.SetAsBox(halfW, halfH, new B.b2Vec2(0, 0), 0)
      const fixture = new B.b2FixtureDef()
      fixture.set_shape(shape)
      fixture.set_density(1)
      fixture.set_restitution(0.3)
      body.CreateFixture(fixture)
      if (color) this.obstacles.push({ body, kind: 'box', halfWidth: halfW, halfHeight: halfH, color })
      return body
    }

    const addStaticCircle = (x: number, y: number, r: number, restitution = 0.4) => {
      const bodyDef = new B.b2BodyDef()
      bodyDef.set_type(B.b2_staticBody)
      bodyDef.set_position(new B.b2Vec2(x, y))
      const body = this.world.CreateBody(bodyDef)
      const shape = new B.b2CircleShape()
      shape.set_m_radius(r)
      const fixture = new B.b2FixtureDef()
      fixture.set_shape(shape)
      fixture.set_density(1)
      fixture.set_restitution(restitution)
      body.CreateFixture(fixture)
      return body
    }

    const addKinematicPaddle = (x: number, y: number, halfW: number, halfH: number, angularVelocity: number, color: string) => {
      const bodyDef = new B.b2BodyDef()
      bodyDef.set_type(B.b2_kinematicBody)
      bodyDef.set_position(new B.b2Vec2(x, y))
      const body = this.world.CreateBody(bodyDef)
      const shape = new B.b2PolygonShape()
      shape.SetAsBox(halfW, halfH, new B.b2Vec2(0, 0), 0)
      const fixture = new B.b2FixtureDef()
      fixture.set_shape(shape)
      fixture.set_density(1)
      fixture.set_restitution(0.2)
      body.CreateFixture(fixture)
      body.SetAngularVelocity(angularVelocity)
      this.obstacles.push({ body, kind: 'box', halfWidth: halfW, halfHeight: halfH, color })
    }

    // 두 점을 잇는 벽을 만든다 (깔때기·좁은 구간처럼 각도가 필요한 벽에 사용)
    const addWallSegment = (x1: number, y1: number, x2: number, y2: number, thickness: number, color?: string) => {
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2
      const length = Math.hypot(x2 - x1, y2 - y1)
      const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
      addStaticBox(cx, cy, length / 2, thickness / 2, angleDeg, color)
    }

    // 좌우 벽 (스폰 위치부터 바닥까지 넉넉하게)
    const wallHeight = (FLOOR_Y - SPAWN_TOP_Y) + 40
    const wallCenterY = (FLOOR_Y + SPAWN_TOP_Y) / 2
    addStaticBox(0, wallCenterY, 0.3, wallHeight / 2)
    addStaticBox(WORLD_WIDTH, wallCenterY, 0.3, wallHeight / 2)
    // 바닥 (혹시 장애물을 다 피해가는 구슬을 위한 안전망)
    addStaticBox(WORLD_WIDTH / 2, FLOOR_Y, WORLD_WIDTH / 2, 0.3)

    // 입구 깔때기 — 위에서 쏟아지는 구슬을 가운데 못 영역으로 모아준다
    const funnelTopY = SPAWN_TOP_Y + 1.5
    const funnelBottomY = PEG_START_Y - 1
    const funnelCenterY = (funnelTopY + funnelBottomY) / 2
    const funnelHalfH = Math.abs(funnelBottomY - funnelTopY) / 2
    addStaticBox(3.5, funnelCenterY, 0.15, funnelHalfH, -22, FUNNEL_COLOR)
    addStaticBox(WORLD_WIDTH - 3.5, funnelCenterY, 0.15, funnelHalfH, 22, FUNNEL_COLOR)

    // 못 배열 (갈톤 보드) — 줄마다 번갈아 offset을 줘서 무작위 반사를 유도, 두 가지 색으로 리듬감
    const pegRadius = 0.26
    for (let row = 0; row < PEG_ROWS; row++) {
      const cols = row % 2 === 0 ? 8 : 7
      const offset = row % 2 === 0 ? 1.5 : 3
      for (let col = 0; col < cols; col++) {
        const x = offset + col * 2.2
        const y = PEG_START_Y + row * PEG_ROW_SPACING
        const body = addStaticCircle(x, y, pegRadius, 0.4)
        this.obstacles.push({ body, kind: 'circle', radius: pegRadius, color: PEG_COLOR })
      }
    }

    // 회전 장애물 (패들) — 못 사이사이에서 구슬을 예측 불가능하게 튕겨낸다
    const paddleRows = [2, 5]
    paddleRows.forEach((row, i) => {
      const y = PEG_START_Y + row * PEG_ROW_SPACING + PEG_ROW_SPACING / 2
      addKinematicPaddle(6, y, 1.6, 0.14, i % 2 === 0 ? 2.5 : -2.5, PADDLE_COLOR)
      addKinematicPaddle(14, y, 1.6, 0.14, i % 2 === 0 ? -2.5 : 2.5, PADDLE_COLOR)
    })

    // 통통 튀는 범퍼 — 하단부에 배치해 마지막까지 긴장감을 준다
    const bumperRow = PEG_ROWS - 2
    const bumperY = PEG_START_Y + bumperRow * PEG_ROW_SPACING + PEG_ROW_SPACING / 2
    ;[5, 10, 15].forEach((x) => {
      const body = addStaticCircle(x, bumperY, 0.55, 1.3)
      this.obstacles.push({ body, kind: 'circle', radius: 0.55, color: BUMPER_COLOR })
    })

    // 결승선 직전 좁은 구간 — 통로를 확 좁혀서 마지막 구슬이 여기서 걸리도록 긴장감을 극대화한다.
    // 벽을 실제 좌우 벽(x=0, x=WORLD_WIDTH)에서부터 시작시켜서 바깥쪽으로 새어나갈 틈을 없앤다.
    addWallSegment(0, NECK_TOP_Y, WORLD_WIDTH / 2 - NECK_HALF_GAP, NECK_BOTTOM_Y, 0.35, FUNNEL_COLOR)
    addWallSegment(WORLD_WIDTH, NECK_TOP_Y, WORLD_WIDTH / 2 + NECK_HALF_GAP, NECK_BOTTOM_Y, 0.35, FUNNEL_COLOR)

    // 좁아진 통로 안에서 천천히 회전하는 막대 — 마지막 순간 극적인 반전을 만든다
    const finalPaddleY = (NECK_BOTTOM_Y + GOAL_Y) / 2
    addKinematicPaddle(WORLD_WIDTH / 2, finalPaddleY, NECK_HALF_GAP - 0.3, 0.16, 3, FINAL_PADDLE_COLOR)
  }

  spawnMarbles(specs: MarbleSpec[]) {
    const B = this.Box2D
    const count = specs.length
    this.totalMarbles = count
    this.finishOrder = []
    this.stuckTrackers.clear()

    specs.forEach((spec, i) => {
      const jitterX = (Math.random() - 0.5) * 0.4
      const base = computeSpawnPosition(i, count)
      const x = base.x + jitterX
      const y = base.y

      const bodyDef = new B.b2BodyDef()
      bodyDef.set_type(B.b2_dynamicBody)
      bodyDef.set_position(new B.b2Vec2(x, y))
      const body = this.world.CreateBody(bodyDef)
      const shape = new B.b2CircleShape()
      shape.set_m_radius(MARBLE_RADIUS)
      const fixture = new B.b2FixtureDef()
      fixture.set_shape(shape)
      fixture.set_density(1)
      fixture.set_friction(0.3)
      fixture.set_restitution(0.35)
      body.CreateFixture(fixture)

      this.bodies.set(spec.id, body)
      this.specs.set(spec.id, spec)
    })
  }

  start() {
    this.started = true
  }

  step(dt: number) {
    if (!this.started) return
    this.world.Step(dt, 6, 2)
    this.checkFinishesAndStuck()
  }

  // 골라인을 넘은 구슬은 도착 순서에 기록하고 제거하며, 오래 멈춰있는 구슬은 살짝 흔들어 정체를 풀어준다
  private checkFinishesAndStuck() {
    const finished: number[] = []
    this.bodies.forEach((body, id) => {
      const spec = this.specs.get(id)
      if (!spec) return
      const pos = body.GetPosition()

      if (pos.y > GOAL_Y) {
        this.finishOrder.push(spec.entryNumber)
        finished.push(id)
        return
      }

      let tracker = this.stuckTrackers.get(id)
      if (!tracker) {
        tracker = { checkY: pos.y, framesLeft: STUCK_CHECK_FRAMES }
        this.stuckTrackers.set(id, tracker)
      }
      tracker.framesLeft -= 1
      if (tracker.framesLeft <= 0) {
        if (Math.abs(pos.y - tracker.checkY) < 0.15) {
          body.ApplyLinearImpulseToCenter(
            new this.Box2D.b2Vec2((Math.random() - 0.5) * 4, -(1 + Math.random() * 1.5)),
            true
          )
        }
        tracker.checkY = pos.y
        tracker.framesLeft = STUCK_CHECK_FRAMES
      }
    })

    finished.forEach((id) => {
      this.stuckTrackers.delete(id)
      this.removeMarble(id)
    })
  }

  getMarbleStates(): MarbleState[] {
    const states: MarbleState[] = []
    this.bodies.forEach((body, id) => {
      const spec = this.specs.get(id)
      if (!spec) return
      const pos = body.GetPosition()
      states.push({ id, entryNumber: spec.entryNumber, color: spec.color, x: pos.x, y: pos.y, angle: body.GetAngle() })
    })
    return states
  }

  getObstacleStates(): ObstacleState[] {
    return this.obstacles.map((o) => {
      const pos = o.body.GetPosition()
      return {
        kind: o.kind,
        x: pos.x,
        y: pos.y,
        angle: o.body.GetAngle(),
        radius: o.radius,
        halfWidth: o.halfWidth,
        halfHeight: o.halfHeight,
        color: o.color,
      }
    })
  }

  // 도착 순서(응모 번호). 배열의 마지막 원소가 "가장 마지막에 떨어진" 당첨자다
  getFinishOrder(): number[] {
    return this.finishOrder
  }

  getRemainingCount(): number {
    return this.bodies.size
  }

  isComplete(): boolean {
    return this.totalMarbles > 0 && this.finishOrder.length === this.totalMarbles
  }

  removeMarble(id: number) {
    const body = this.bodies.get(id)
    if (body) {
      this.world.DestroyBody(body)
      this.bodies.delete(id)
      this.specs.delete(id)
    }
  }
}
