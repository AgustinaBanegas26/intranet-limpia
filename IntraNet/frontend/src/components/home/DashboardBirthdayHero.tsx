import { useEffect, useMemo, useState } from 'react'

import { motion } from 'framer-motion'

import {

  celebracionesService,

  type CelebracionesDTO,

} from '../../services/celebraciones'

import {

  buildFeaturedDashboardBirthdays,

  buildUpcomingOnlyPersons,

  isBirthdayToday,

  type SelfBirthdayProfile,

} from '../../utils/birthdayUpcoming'

import { BirthdayCard } from './BirthdayCard'

import { BirthdayCarousel } from './BirthdayCarousel'

import { BirthdayUpcomingAccordion } from './BirthdayUpcomingAccordion'



interface DashboardBirthdayHeroProps {

  token?: string | null

  selfProfile?: SelfBirthdayProfile | null

}



export function DashboardBirthdayHero({

  token,

  selfProfile,

}: DashboardBirthdayHeroProps) {

  const [celebraciones, setCelebraciones] = useState<CelebracionesDTO | null>(null)



  useEffect(() => {

    let active = true

    celebracionesService

      .getAll(token, 31)

      .then((res) => { if (active) setCelebraciones(res.data) })

      .catch(() => { if (active) setCelebraciones(null) })

    return () => { active = false }

  }, [token])



  const todaysBirthdays = useMemo(

    () => buildFeaturedDashboardBirthdays(celebraciones, selfProfile),

    [celebraciones, selfProfile],

  )



  const upcomingPersons = useMemo(

    () => buildUpcomingOnlyPersons(celebraciones?.proximosCumpleanos ?? []),

    [celebraciones],

  )



  const hasToday = todaysBirthdays.length > 0

  const hasUpcoming = upcomingPersons.length > 0



  if (!hasToday && !hasUpcoming) return null



  return (

    <motion.section

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.24 }}

    >

      {hasToday ? (

        todaysBirthdays.length === 1 ? (

          <BirthdayCard

            person={todaysBirthdays[0]}

            isToday={isBirthdayToday(todaysBirthdays[0])}

            isUpcoming={false}

            upcomingPersons={upcomingPersons}

          />

        ) : (

          <BirthdayCarousel

            persons={todaysBirthdays}

            autoplayInterval={5000}

            upcomingPersons={upcomingPersons}

          />

        )

      ) : (

        <BirthdayUpcomingAccordion persons={upcomingPersons} />

      )}

    </motion.section>

  )

}

